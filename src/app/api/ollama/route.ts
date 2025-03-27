import ollama from 'ollama';
import { NextResponse } from 'next/server';
import { AnimationData } from '../../types';


function buildPrompt(data: AnimationData): string {
  // Start with the required fields
  let prompt = `You are an expert anime.js developer. Generate a complete, optimized JavaScript code snippet using anime.js that meets the following animation requirements:
      General Instruction: ${data.general_instruction}
      Elements: ${data.elements}
      Animation Details: ${data.animation_details}
      Timing & Easing: ${data.timing_easing}
      Triggering: ${data.triggering}
      `;

    // Define optional fields
    const optionalFields: [string, keyof AnimationData][] = [
      ["HTML Structure/Selectors", "html_structure"],
      ["Responsive Behavior", "responsive_behavior"],
      ["Sequential/Simultaneous Animation", "animation_sequence"],
      ["Repeat/Loop Behavior", "repeat_behavior"],
      ["Additional Effects/Callbacks", "additional_effects"],
      ["Debugging/Logging", "debugging_logging"],
      ["Fallbacks", "fallbacks"],
      ["User Controls", "user_controls"],
      ["Transitions/States", "transitions_states"],
      ["Style/Constraints", "style_constraints"]
    ];

    // Add optional fields if provided
    for (const [label, key] of optionalFields) {
      const value = data[key]?.trim();
      if (value) {
        prompt += `${label}: ${value}\n`;
      }
    }

    // Add final instructions
    prompt += `IMPORTANT: Ensure the code is well-optimized, follows best practices, and is cross-browser compatible.
      The result should be a complete, standalone HTML code snippet containing the javascript code for the animation that can be run in a browser.
      `;

  return prompt;
}



export async function POST(request: any) {
  try {
    // Parse the request body
    const formData = await request.json();

    // Create prompt
    const prompt = buildPrompt(formData);

    // Set up Ollama streaming
    const response = await ollama.chat({
      model: process.env.MODEL_NAME as string,
      messages: [{ role: 'user', content: prompt }], // Correct prompt usage
      stream: true,
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
