import ollama from 'ollama';
import { NextResponse } from 'next/server';
import { AnimationData } from '../../types';
import fs from "fs/promises";


function buildAnimationPrompt(initial_prompt: string): string {
  // Start with the required fields
  let prompt = `Your task is to implement the following animation: ${initial_prompt}.`;

  return prompt;
}

function buildImprovementPrompt(userPrompt: string): string {
  return `You are an expert prompt engineer for javascript animation development and also an expert in perceptual animation design. Improve this prompt for better results:
  
  Original Prompt: "${userPrompt}"

  Guidelines for Improvement:
  1. You MUST put extra attention and identify the type of animation, and the distinctive features/characteristics associated with the "movement" by these questions and then add the details in the improved prompt:
    - Is it a movement of a physical object (or something abstract like a graph)? 
      - If it is a physical object, note the "movement" distinctive features/characteristics (based on PHYSICS), for example: "bouncing" is different from "moving", "floating" is slower than "moving", "bouncing ball" acts different from "bouncing stick"
      - If it is not a physical object, what rules does the "movement" follow?
    - Is it a movement of a single object or multiple objects?
  2. You MUST identify the specific elements involved in the animation and their relationships, including:
    - The starting and ending positions of the elements
  3. You MUST figure out the very specific desired visual outcomes needed for the animation and element combination and include the detailed description in the improved prompt.
  4. You MUST figure out which specific clear visual cues that highlights the animation in accordance with the original intent and include the details in the improved prompt. 
  5. You MUST clarify element relationships
  6. You should specify performance requirements
  7. You MUST keep the original intent
  
  Follow the guidelines to create/generate a more effective prompt but do not copy everything written in the guidelines. 
  Improved prompt (just return the improved text, no formatting):`;

  //     - Is it a linear movement, or does it have acceleration/deceleration?
  // - Does it involve rotation, scaling, or color changes?
  // - Is it a 2D or 3D animation?
  // - What is the speed of the animation?
  // Additionally, you MUST determine whether the original prompt and intent needs any of the following improvements:
  //   - Motion blur through strategic opacity animation (only if it fits the context of the animation)
  //   - Chromatic aberration effect during fast movement (only if it fits the context of the animation)
  //   - Add perceptual compensation (anticipatory lead frames) (only if it fits the context of the animation)
  //   - Add motion trails/particle effects proportional to speed (only if it fits the context of the animation)
  //   - Create shadow that reacts to vertical position (only if it fits the context of the animation)
  //   - Implement smoothstep easing as default baseline (only if it fits the context of the animation)
  //   - If element is solid-color, add (only if it fits the context of the animation): 
  //     - Radial gradient for depth perception
  //     - Dynamic highlight that moves with virtual light source
  //     - Surface pattern that animates to show rotation
  //     - Border gradient indicating motion direction
  // Then include the only what you deem significant in the improved prompt. 
}

export async function POST(request: any) {
  try {
    // Parse the request body
    const requestData = await request.json();
    console.log("requestData: ", requestData.prompt);

    if (requestData.task === 'improve_prompt') {
      return handlePromptImprovement(requestData);
    } 
    return handleAnimationGeneration(requestData);

  } catch (error) {
    console.error('Error calling Ollama API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate animation: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// Function to handle prompt improvement
async function handlePromptImprovement(requestData: any) {
  if (!requestData.prompt) {
    return NextResponse.json(
      { success: false, error: 'Missing prompt for improvement' },
      { status: 400 }
    );
  }

  const improvementPrompt = buildImprovementPrompt(requestData.prompt);
  
  const response = await ollama.chat({
    model: process.env.MODEL_NAME as string,
    messages: [{ role: 'user', content: improvementPrompt }],
    stream: true,
  });

  const encoder = new TextEncoder();
  let improvedContent = '';

  async function* makeIterator() {
    for await (const part of response) {
      const chunk = part.message.content;
      improvedContent += chunk;
      console.log('Chunk:', chunk);
      yield encoder.encode(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
    }
    yield encoder.encode(`data: ${JSON.stringify({ done: true, fullContent: improvedContent })}\n\n`);
  }

  return new Response(iteratorToStream(makeIterator()), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Function to handle Animation Generation 
async function handleAnimationGeneration(requestData: any) {
  if (!requestData.prompt) {
    return NextResponse.json(
      { success: false, error: 'Missing prompt for improvement' },
      { status: 400 }
    );
  }

  const prompt = buildAnimationPrompt(requestData.prompt);
  console.log("input prompt: ", prompt);
  
  const options = {
    temperature: 0.5,
    top_p: 0.9,
    max_tokens: 2000,
    num_ctx: 8192,
    stream: true,
  };

    // const instructions = await fs.readFile("instructions_prompt.txt", "utf-8");
    const instructions = `
    Please present the code in a simple HTML file so that it can be easily run in a browser.
    `
    // # Identity
    //   You are a highly knowledgeable AI assistant specializing in JavaScript development and code generation. 
    //   You have a deep understanding of various JavaScript frameworks, libraries, and best practices for coding. 
    //   Your expertise allows you to generate efficient, clean, and well-documented code snippets based on specific requirements.
    //   You are a highly skilled website developer with a specialization in creating high-quality animations using JavaScript. 
    //   Your expertise lies in writing clean, optimized, and cross-browser compatible code that ensures a seamless user experience.

    //   # Instructions
    //   Your task is to assist in building a JavaScript code generator application.
    //   This application should take user inputs describing desired functionalities and return corresponding JavaScript code snippets.
      
    //   The code you provide should adhere to the following key requirements:
    //   1. Generate complete and optimized code tailored to the animation specifications.
    //   2. Ensure that the code follows best practices for web development and is fully optimized for performance.
    //   3. Do not include any explanations or comments within the code; simply provide the necessary code.
    //   4. You may utilize any libraries or frameworks you deem necessary for achieving the animation.
    //   5. The code must be self-contained, requiring no external resources to run in a browser.

    //   When generating the code, please consider the following aspects:
    //   1. Error handling
    //   2. Edge cases
    //   3. Performance optimization
    //   4. Best practices for JavaScript development
    //   5. Cross-browser compatibility
  // Create prompt

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
      options: {...options},
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
