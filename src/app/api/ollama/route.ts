import ollama from 'ollama';
import { NextResponse } from 'next/server';
import { AnimationData, ImprovementRequest } from '../../types';


function buildAnimationPrompt(data: AnimationData): string {
  // Start with the required fields
  const frameworkRules = data.techConstraints.framework === 'react' ? `
  - Use React functional components with hooks
  - All DOM access must be in useEffect/useLayoutEffect
  - Use useRef for element references
  - No class components
  - Add error boundaries` : `
  - Use vanilla JavaScript
  - No external dependencies`;

  const renderingRules = {
    dom: '- Use CSS transforms for smooth animations',
    svg: '- Calculate viewBox dynamically\n- Use stroke-dasharray for line animations',
    canvas: '- Request animation frame\n- Double buffering\n- Cleanup resources'
  }[data.techConstraints.rendering];

  const physicsRules = {
    spring: `- Implement spring physics with tension ${data.techConstraints.physics.coordinateSystem === 'relative' ? 150 : 100}`,
    easing: `- Use ${data.techConstraints.physics.motionType === 'easing' ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'linear'} timing`,
    frame: '- Implement requestAnimationFrame loop'
  }[data.techConstraints.physics.motionType];

  let prompt = `You are an expert javascript animation developer. Generate a complete, optimized JavaScript code snippet that meets the following animation requirements:
      Technical Constraints:
      Framework: ${data.techConstraints.framework.toUpperCase()}
      ${frameworkRules}
      Rendering: ${data.techConstraints.rendering.toUpperCase()}
      ${renderingRules}
      Physics:
      ${physicsRules}
      Coordinate System: ${data.techConstraints.physics.coordinateSystem}

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

function buildImprovementPrompt(currentData: ImprovementRequest['currentData']): string {
  return `You are an expert javascript animation prompt engineer. Improve these specifications:
  
  Current Specifications:
  ${JSON.stringify(currentData, null, 2)}

  Guidelines for Improvement:
  1. Make it more specific about desired VISUAL outcomes (for the general_instruction)
  2. Clarify element relationships
  3. Specify performance requirements
  4. Maintain the original intent

  IMPORTANT: Return VALID JSON ONLY. Follow these rules:
  1. Maintain original field names exactly
  2. All response fields must be STRING VALUES ONLY. Never return objects or nested values.
  3. Keep JSON structure intact
  4. Escape special characters
  5. Return complete JSON in one response
  6. Never return markdown formatting

  Example valid response:
  {
    "general_instruction": "Create smooth transition...",
    "elements": "Main container div...",
    "animation_details": "Fade-in effect...",
    "timing_easing": "300ms cubic-bezier(...)",
    "triggering": "On scroll event",
    "repeat_behavior": "Infinite loop"
  }

  Improved specifications:`;
}



export async function POST(request: any) {
  try {
    // Parse the request body
    const requestData = await request.json();

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
async function handlePromptImprovement(requestData: ImprovementRequest) {
  const improvementPrompt = buildImprovementPrompt(requestData.currentData);
  
  const response = await ollama.chat({
    model: process.env.MODEL_NAME as string,
    messages: [{ role: 'user', content: improvementPrompt }],
    stream: true,
  });

  const encoder = new TextEncoder();
  let jsonBuffer = '';

  async function* makeIterator() {
    for await (const part of response) {
      const chunk = part.message.content;
      jsonBuffer += chunk;
      
      // Stream partial updates
      yield encoder.encode(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
    }

    // Validate final JSON
    try {
      JSON.parse(jsonBuffer);
      yield encoder.encode(`data: ${JSON.stringify({ done: true, fullContent: jsonBuffer })}\n\n`);
    } catch (error) {
      yield encoder.encode(`data: ${JSON.stringify({ error: "Invalid JSON format" })}\n\n`);
    }
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
async function handleAnimationGeneration(formData: AnimationData) {
  const prompt = buildAnimationPrompt(formData);
  const options = {
    temperature: 0.5,
    top_p: 0.9,
    max_tokens: 2000,
    stream: true,
  };

  // Create prompt

  // Set up Ollama streaming
  const response = await ollama.chat({
    model: process.env.MODEL_NAME as string,
    messages: [{ role: 'user', content: prompt , }], // Correct prompt usage
    options: options, // Check if this might cause error (positional)
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
