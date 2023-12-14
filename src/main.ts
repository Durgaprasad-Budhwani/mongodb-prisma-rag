import {PrismaClient} from '@prisma/client';
import * as path from "path";
import * as fs from "fs";
// @ts-ignore
import csvParser from "csv-parser";
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
})

const prisma = new PrismaClient();

interface Award {
  id: string;
  yearFilm: number;
  yearCeremony: number;
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
      year_film: Number(data.yearFilm),
      year_ceremony: Number(data.yearCeremony),
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
  const {yearCeremony, category, name, winner} = awardData;
  return `In the ${yearCeremony} Oscar Awards, the category ${category} was nominated ${name} and ${winner ? 'won' : 'did not win'}  the award.`;
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
  console.log(result);
}

// Function to read CSV data and perform upsert for each record
const processCSVData = async (filePath: string) => {
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', async (row: Award) => {
      if (Number(row.yearCeremony) >= 2023 && row.name && row.film) {
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

searchAward("ACTOR IN A SUPPORTING ROLE");
