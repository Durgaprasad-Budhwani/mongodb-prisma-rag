import {PrismaClient} from '@prisma/client';
import * as fs from "fs";
// @ts-ignore
import csvParser from "csv-parser";
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import { PromptTemplate } from "langchain/prompts";
import { OpenAI } from "langchain/llms/openai";
import {LLMChain} from "langchain/chains";
import * as path from "path";

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
})

const model = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
});


const prisma = new PrismaClient();

interface Award {
  id: string;
  year_film: number;
  year_ceremony: number;
  ceremony: string;
  category: string;
  name: string;
  film: string;
  winner: boolean | string;
  award_embeddings?: number[];
  description?: string;
}

export const createAward = async (data: Award) => {
  data.winner = (data?.winner as string)?.toLowerCase() === 'true';
  const description = formatAwardSentence(data);
  const award_embeddings = await embeddings.embedQuery(
    description
  );
  await prisma.awards.create({
    data: {
      year_film: Number(data.year_film),
      year_ceremony: Number(data.year_ceremony),
      ceremony: data.ceremony,
      category: data.category,
      name: data.name,
      film: data.film,
      winner: data.winner,
      description,
      award_embeddings,
    }
  });
}

const formatAwardSentence = (awardData: Award): string => {
  const {year_ceremony, category, name, winner} = awardData;
  return `In the ${year_ceremony} Oscar Awards, the category ${category} was nominated ${name} and ${winner ? 'won' : 'did not win'}  the award.`;
};

const searchAward = async (query: string) => {
  const res = await embeddings.embedQuery(
    query
  );

  const result = await prisma.awards.aggregateRaw({
    pipeline: [
      {
        '$vectorSearch': {
          'index': 'award_embeddings_index',
          'path': 'award_embeddings',
          'queryVector': res,
          'numCandidates': 200,
          'limit': 10
        }
      },
      {
        '$project': {
          '_id': 1,
          'description': 1,
          'score': {
            '$meta': 'vectorSearchScore'
          }
        }
      }
    ]
  });
  if (result) {
    // @ts-ignore
    const description = result?.map((item: any) => item.description).join('\n') || '';
    const prompt = PromptTemplate.fromTemplate(
      `Answer the question based on only the following context:
        {context}
        Question: {question}`
    );
    const chain = new LLMChain({ llm: model, prompt });
    const res = await chain.call({
      context: description,
      question: query,
    });

    console.log(res);
  }
}

// Function to read CSV data and perform upsert for each record
const processCSVData = async (filePath: string) => {
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', async (row: Award) => {
      if (Number(row.year_ceremony) >= 2023 && row.name && row.film) {
        await createAward(row); // Assuming row is an object with CSV data
      }
    })
    .on('end', () => {
      console.log('CSV data processing completed.');
      prisma.$disconnect();
    });
};


const csvFilePath = path.join(__dirname, '..', 'data', 'the_oscar_award.csv');
processCSVData(csvFilePath);

searchAward("Who one the best supporting role award. Answer only name");
