import ollama from 'ollama';
import { NextResponse } from 'next/server';
import { AnimationData } from '../../types';


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
