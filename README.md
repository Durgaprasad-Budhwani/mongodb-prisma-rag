
## Unlocking the Power of Retrieval-Augmented Generation with MongoDB Atlas Vector Search, Prisma, and OpenAI Embeddings

Retrieval-Augmented Generation (RAG) represents a significant advancement in the field of natural language processing (NLP) and artificial intelligence (AI). It combines the power of pre-trained language models with external information retrieval, enabling systems to generate more informed and contextually relevant responses. This article will delve into RAG’s components, explain how MongoDB Atlas’s Vector Database supports embedding storage and semantic search, describe creating embeddings using OpenAI, introduce LangChain, and analyze a provided code snippet involving these technologies.

![](https://cdn-images-1.medium.com/max/3584/1*YCLd-M2FNulHptzzoEAeIA.png)

## Prerequisites

Before diving into the implementation, make sure you have the following tools and technologies set up:

1. **MongoDB Atlas**: Create an account on MongoDB Atlas ([https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)) and set up a cluster for your database.

2. **Prisma**: Install and set up Prisma ([https://www.prisma.io/](https://www.prisma.io/)) to manage your database schema and perform queries.

3. **OpenAI API**: Obtain an API key for OpenAI ([https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)) to access their text embeddings.

4. **Dataset**: Kaggle offers a wealth of datasets, and for this demonstration, we will use the “The Oscar Award” dataset, which contains information about Oscar awards spanning multiple years. You can access this dataset on Kaggle at [https://www.kaggle.com/datasets/unanimad/the-oscar-award](https://www.kaggle.com/datasets/unanimad/the-oscar-award).

5. **Yarn** installed on your system. You can download and install Yarn from the official website: [https://classic.yarnpkg.com/en/docs/install](https://classic.yarnpkg.com/en/docs/install)

## Components of Retrieval-Augmented Generation

RAG typically consists of two key components:

1. **Language Model (Generator)**: This is a pre-trained model like GPT (Generative Pre-trained Transformer) that generates text based on given prompts.

2. **Retrieval System**: This system retrieves relevant information from a database or knowledge base, which the language model then uses to generate more accurate and context-specific outputs.

The synergy between these components allows for the generation of responses that are not only fluent but also factually accurate and context-aware.

## MongoDB Atlas Vector Database for Embedding Storage and Semantic Search

MongoDB Atlas offers a Vector Database, which is pivotal for storing embeddings in RAG systems. Embeddings are high-dimensional vector representations of text, allowing for the efficient comparison and retrieval of semantically similar content.

### Storing Embeddings:

* MongoDB Atlas: It can store large volumes of embeddings generated from text data. These embeddings are used to understand the semantic similarity between different pieces of text.

### Semantic Search:

* Vector Search Capabilities: MongoDB Atlas enables vector search, allowing users to find documents in the database that are semantically similar to a given query, significantly enhancing the search experience.

## Setup the Project

### Step 1: Create a New Node.js Project

Open your terminal and create a new directory for your project. Navigate to the project directory and initialize a new Node.js project using the following commands:

    mkdir my-node-app
    cd my-node-app
    yarn init -y

This will create a package.json file in your project directory with default settings.

### Step 2: Install Dependencies

Next, let’s install the dependencies mentioned in your package.json file using Yarn. Open the package.json file and add the following dependencies:

    {
      "dependencies": {
        "@prisma/client": "^5.7.0",
        "csv-parser": "^3.0.0",
        "langchain": "^0.0.207"
        "prisma": "^5.7.0",
        "ts-node": "^10.9.2",
        "tslib": "~2.6"
      }
    }

Now, you can install these dependencies using Yarn:

    yarn install

This will download and install the specified packages into your project.

### Step 3: Set Up TypeScript

To use TypeScript in your project, create a TypeScript configuration file. Create a tsconfig.json file in your project directory with the following content:

    {
      "compilerOptions": {
        "target": "ES6",
        "module": "CommonJS",
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true
      },
      "include": ["src/**/*.ts"],
      "exclude": ["node_modules"]
    }

This configuration specifies that TypeScript files should be located in the src directory and compiled to JavaScript in the dist directory.

### Step 4: Set Up Prisma

To set up Prisma with Yarn, you can follow the same steps as mentioned in the previous response:

### Initialize Prisma in your project:

    npx prisma init

This command will guide you through the initialization process, including configuring your database connection and generating Prisma client files.

### Step 5: Running Your Application

To run your Node.js application with TypeScript using Yarn, you can use the ts-node command in your package.json file:

    {
      "scripts": {
        "dev": "ts-node src/main.ts"
      }
    }

## Efficiently Seeding MongoDB with OSCAR Award Data:

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

The provided Node.js script serves as a pipeline for reading OSCAR award data from a CSV file and inserting it into a MongoDB database. Let’s dissect the script to understand its functionality.

**Reading CSV File:**

* fs.createReadStream(filePath) creates a readable stream of the CSV file, enabling efficient reading of large files.

* .pipe(csvParser()) transforms the raw CSV data into JavaScript objects for each row.

**Handling Each Row:**

* The .on('data', async (row: Award) => {...}) event listener processes each row as it's read from the CSV file.

* The row parameter represents an individual record from the CSV file.

**Upsert Logic:**

* The if (Number(row.year_ceremony) >= 2023 && row.name && row.film) condition filters out records based on specific criteria (year of the ceremony, name, and film presence).

* await createAward(row) suggests an upsert operation for each qualifying record into MongoDB.

**Completion Event:**

* The .on('end', () => {...}) event signifies the end of the CSV file processing.

* prisma.$disconnect() closes the database connection, indicating the completion of all data operations.

## A Deep Dive into OpenAI Embeddings and MongoDB Integration:

    export const createAward = async (data: Award) => {
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      })
    
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

The code snippet in focus offers a glimpse into a function named createAward, which is designed to process and store award data in a MongoDB database. The process involves generating a description for each award and then creating embeddings for this description using OpenAI's API. Let's dissect this process:

OpenAI’s embeddings are at the core of this code. They serve as a bridge between raw data and a more enriched, AI-enhanced representation. Embeddings are essentially high-dimensional vectors that capture the semantic essence of the text, making them incredibly useful for a variety of AI-driven applications.

In our specific example, the code generates an embedding for each award description. This is done by calling embeddings.embedQuery(description), which interacts with OpenAI's API to convert the textual description into a semantic vector.

The final piece of the puzzle is the storage of this enriched data in MongoDB. The code uses Prisma, an ORM (Object-Relational Mapping) tool, which simplifies interactions with the database. The prisma.awards.create method is used to create a new record in the database, storing not just the original award data but also the generated description and its corresponding embedding.

## Step-by-Step Guide to Creating a Search Index in MongoDB Atlas with Vector Search

Creating a search index in MongoDB Atlas, especially one that leverages the power of Atlas Vector Search, is a crucial step for modern applications that require fast and efficient search capabilities.

### Step 1: Accessing MongoDB Atlas

Firstly, navigate to the MongoDB Atlas dashboard. This is your control center for managing databases, clusters, and various database features including Atlas Search.

### Step 2: Going to Atlas Search

In the MongoDB Atlas dashboard, locate the ‘Atlas Search’ option. This feature is designed to provide full-text search capabilities and more advanced search functionalities like vector search.

![](https://cdn-images-1.medium.com/max/3826/1*gSsqEZL0Os9lgj6zb388_w.png)

### Step 3: Creating a Search Index

Here, you’ll begin the process of setting up a new search index:

![](https://cdn-images-1.medium.com/max/2614/1*FLIC6Q_FgueiNDt7X_zMzQ.png)

1. Selecting Atlas Vector Search (JSON Editor): Choose the Atlas Vector Search option and ensure you’re in the JSON Editor mode. This mode allows you to define the index configuration using JSON syntax, offering more flexibility and control.

2. Selecting Database and Collection:

* Database Name: Specify mongodb-prisma-rag as the database name. This is the database where your collection resides.

* Collection Name: Choose awards as the collection for which you are creating the index. This collection will store the award data along with the embeddings.

### Step 4: Configuring the JSON for Vector Search

![](https://cdn-images-1.medium.com/max/3026/1*gkiCEdOlumWIdedg4KJDDw.png)

Now, you will define the specifics of the vector search index:

    {
      "type": "vectorSearch",
      "fields": [
        {
          "type": "vector",
          "path": "award_embeddings",
          "numDimensions": 1536,
          "similarity": "euclidean"
        }
      ]
    }

* Path: The path field should be set to award_embeddings, which is the field in your documents where the vector data is stored.

* numDimensions: Here, you specify the number of dimensions for your vectors. In this case, it’s 1536.

* Similarity: The similarity setting determines how the similarity between vectors is calculated. euclidean is a common choice for vector similarity.

### Step 5: Naming and Creating the Index

Finally, name your search index — for instance, award_embeddings_index. This name will be used to reference the index in your search queries.

### Step 6: Index Creation Process

After configuring the settings, create the index. Keep in mind that the index creation might take some time, especially if your collection is large.

![](https://cdn-images-1.medium.com/max/3784/1*NC_HfJnqrrHsd6zyQSbYFw.png)

## Implementing Semantic Similarity Search in a Vector Database:

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

The provided Node.js code snippet demonstrates a function, searchAward, designed to perform semantic similarity searches in a MongoDB database using vector search. Let's break down the key components and functionalities of this code:

### Step 1: Embedding the Query

The first step in the process is to convert the search query into a vector using embeddings:

    const res = await embeddings.embedQuery(query);

* embedQuery: This function call to embeddings.embedQuery(query) takes the user's search query and converts it into an embedding, a high-dimensional vector representing the semantic content of the query.

* Purpose: This embedding is then used to find similar items in the database, where ‘similarity’ is determined based on the proximity of vectors in the vector space.

### Step 2: Performing the Vector Search

Once the query is converted into an embedding, the next step is to search the database:

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

* Vector Search: The $vectorSearch stage in the aggregation pipeline is where the magic happens. It uses the award_embeddings_index to search for documents in the awards collection whose award_embeddings field vectors are similar to the query vector.

* Configuring the Search: The numCandidates parameter specifies the number of potential matches to consider, and limit confines the number of results returned.

* Projection: The $project stage specifies which fields to include in the results. Here, it includes the document ID, the description, and the search score, which indicates the degree of similarity.

### Step 3: Processing the Results

After retrieving the results, the function processes them to extract meaningful information:

    const description = result?.map((item: any) => item.description).join('\n') || '';

* This line maps through the search results, extracting the description of each matching award, and joins them into a single string. This consolidated string can then be used for further processing or display to the user.

### Step 4: Utilizing the Results

The code snippet hints at additional processing using a PromptTemplate and a LLMChain, likely to further analyze or utilize the search results in the context of a larger application, such as answering a query based on the retrieved context.

### **Result:**

![](https://cdn-images-1.medium.com/max/2000/1*j_cJ7UaFdmsz-9vr83TIkA.png)

## Source Code:

Check it out now at [mongodb-prisma-rag](https://github.com/Durgaprasad-Budhwani/mongodb-prisma-rag) and explore the possibilities of modern database technologies and AI! 🌟💻📊

## Conclusion:

In conclusion, this blog post has provided a comprehensive overview of Retrieval-Augmented Generation (RAG) and how to harness its power with MongoDB Atlas Vector Search, Prisma, and OpenAI Embeddings. We’ve covered the essential components of RAG, including language models and retrieval systems, and discussed how MongoDB Atlas’s Vector Database facilitates the storage of embeddings for semantic search.

The post has also offered a step-by-step guide on setting up a Node.js project with the necessary dependencies, creating a search index in MongoDB Atlas for efficient searching, and implementing semantic similarity searches using vector search in a MongoDB database.

By combining these technologies and techniques, you can unlock the potential of modern database technologies and AI, enabling you to build applications that generate contextually relevant and accurate responses. The possibilities are vast, and this blog post has laid the foundation for you to explore and innovate further in the field of natural language processing and artificial intelligence.
