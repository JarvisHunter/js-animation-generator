import ollama from 'ollama';
import { NextResponse } from 'next/server';
import { AnimationData } from '../../types';
import fs from "fs/promises";


function buildPrompt(data: AnimationData): string {
  // Start with the required fields
  let prompt = `Your task is to implement the following animation: ${data.general_instruction}.`;

  return prompt;
}



export async function POST(request: any) {
  try {
    // Parse the request body
    const formData = await request.json();

    // const instructions = await fs.readFile("instructions_prompt.txt", "utf-8");
    const instructions = `
      # Identity
      You are a highly knowledgeable AI assistant specializing in JavaScript development and code generation. 
      You have a deep understanding of various JavaScript frameworks, libraries, and best practices for coding. 
      Your expertise allows you to generate efficient, clean, and well-documented code snippets based on specific requirements.
      You are a highly skilled website developer with a specialization in creating high-quality animations using JavaScript. 
      Your expertise lies in writing clean, optimized, and cross-browser compatible code that ensures a seamless user experience.

      # Instructions
      Your task is to assist in building a JavaScript code generator application.
      This application should take user inputs describing desired functionalities and return corresponding JavaScript code snippets.
      
      The code you provide should adhere to the following key requirements:
      1. Generate complete and optimized code tailored to the animation specifications.
      2. Ensure that the code follows best practices for web development and is fully optimized for performance.
      3. Do not include any explanations or comments within the code; simply provide the necessary code.
      4. You may utilize any libraries or frameworks you deem necessary for achieving the animation.
      5. The code must be self-contained, requiring no external resources to run in a browser.

      When generating the code, please consider the following aspects:
      1. Error handling
      2. Edge cases
      3. Performance optimization
      4. Best practices for JavaScript development
      5. Cross-browser compatibility

      Please present the code in a simple HTML file so that it can be easily run in a browser.
    `
    // Create prompt
    const prompt = buildPrompt(formData);

    // Set up Ollama streaming
    const response = await ollama.chat({
      model: process.env.MODEL_NAME as string,
      messages: [
        {
            role: "system",
            content: instructions,
        },
        {
            role: "user",
            content: prompt,
        },
      ],
      stream: true,
      options: {
        num_ctx: 8192,
      }
    });

    const encoder = new TextEncoder();
    let fullContent = '';

    // Create streaming iterator
    async function* makeIterator() {
      for await (const part of response) {
        const chunk = part.message.content;
        fullContent += chunk;
        console.log('Chunk:', chunk);

        // Yield properly formatted JSON with newline delimiters
        yield encoder.encode(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
      }

      // Signal completion and send full content
      yield encoder.encode(`data: ${JSON.stringify({ done: true, fullContent })}\n\n`);
    }

    // Return streaming response
    return new Response(iteratorToStream(makeIterator()), {
      headers: {
        'Content-Type': 'text/event-stream', 
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error calling Ollama API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate animation: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// Helper function to convert iterator to stream
function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();

        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
