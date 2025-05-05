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
  // console.log("input prompt: ", prompt);
  
  const options = {
    temperature: 0.5,
    top_p: 0.9,
    max_tokens: 2000,
    num_ctx: 8192,
    stream: true,
  };

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
    const fewShotExamples = [
      { //Transformations	Rotation
        prompt: "Animate a square rotating indefinitely.",
        output: `<!DOCTYPE html>
          <html><body><canvas id="canvas" width="300" height="300"></canvas><script>
          const canvas = document.getElementById("canvas");
          const ctx = canvas.getContext("2d");
          let angle = 0;
          function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(150, 150);
            ctx.rotate(angle);
            ctx.fillStyle = "#FF5733";
            ctx.fillRect(-50, -50, 100, 100);
            ctx.restore();
            angle += 0.01;
            requestAnimationFrame(draw);
          }
          draw();
          </script></body></html>`
      },
      { //Basic Motions	Diagonal with Rotation
        prompt: "Create an animation of a red ball rolling from the top-left corner to the bottom-right corner.",
        output: `<!DOCTYPE html>
      <html><body><canvas id="canvas" width="400" height="300"></canvas><script>
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");
      
      let x = 20, y = 20, radius = 20;
      let dx = 1.5, dy = 1.2, angle = 0;
      
      function drawBall() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.closePath();
        ctx.restore();
      
        x += dx;
        y += dy;
        angle += 0.05;
      
        if (x < canvas.width - radius && y < canvas.height - radius) {
          requestAnimationFrame(drawBall);
        }
      }
      drawBall();
      </script></body></html>`
      },
      { //Basic Motions	Linear Horizontal Movement
        "prompt": "Move a green square from left to right in a loop.",
        "output": "<!DOCTYPE html>\n<html><body><canvas id=\"canvas\" width=\"400\" height=\"100\"></canvas><script>\nconst canvas = document.getElementById(\"canvas\");\nconst ctx = canvas.getContext(\"2d\");\nlet x = 0;\nfunction draw() {\n  ctx.clearRect(0, 0, canvas.width, canvas.height);\n  ctx.fillStyle = \"green\";\n  ctx.fillRect(x, 30, 50, 50);\n  x += 2;\n  if (x > canvas.width) x = -50;\n  requestAnimationFrame(draw);\n}\ndraw();\n</script></body></html>"
      },
      { //Basic Motions	Vertical Bouncing
        "prompt": "Animate a ball bouncing vertically inside a canvas.",
        "output": "<!DOCTYPE html>\n<html><body><canvas id=\"canvas\" width=\"200\" height=\"300\"></canvas><script>\nconst canvas = document.getElementById(\"canvas\");\nconst ctx = canvas.getContext(\"2d\");\nlet y = 0, dy = 2, radius = 20;\nfunction draw() {\n  ctx.clearRect(0, 0, canvas.width, canvas.height);\n  ctx.beginPath();\n  ctx.arc(100, y, radius, 0, Math.PI * 2);\n  ctx.fillStyle = \"blue\";\n  ctx.fill();\n  ctx.closePath();\n  y += dy;\n  if (y + radius > canvas.height || y - radius < 0) dy = -dy;\n  requestAnimationFrame(draw);\n}\ndraw();\n</script></body></html>"
      },
      { //Color	Hue Rotation / Continuous Color Transition
        "prompt": "Cycle background color through a rainbow spectrum over 10 seconds.",
        "output": "<!DOCTYPE html>\n<html><body><script>\nlet hue = 0;\nfunction changeBackground() {\n  document.body.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;\n  hue = (hue + 1) % 360;\n  requestAnimationFrame(changeBackground);\n}\nchangeBackground();\n</script></body></html>"
      },
      { //Transformations	Rotation
        "prompt": "Rotate a star shape continuously around its center.",
        "output": "<!DOCTYPE html>\n<html><body><canvas id=\"canvas\" width=\"300\" height=\"300\"></canvas><script>\nconst canvas = document.getElementById(\"canvas\");\nconst ctx = canvas.getContext(\"2d\");\nlet angle = 0;\nfunction drawStar(cx, cy, spikes, outerRadius, innerRadius) {\n  let rot = Math.PI / 2 * 3;\n  let x = cx;\n  let y = cy;\n  let step = Math.PI / spikes;\n  ctx.beginPath();\n  ctx.moveTo(cx, cy - outerRadius);\n  for (let i = 0; i < spikes; i++) {\n    x = cx + Math.cos(rot) * outerRadius;\n    y = cy + Math.sin(rot) * outerRadius;\n    ctx.lineTo(x, y);\n    rot += step;\n    x = cx + Math.cos(rot) * innerRadius;\n    y = cy + Math.sin(rot) * innerRadius;\n    ctx.lineTo(x, y);\n    rot += step;\n  }\n  ctx.lineTo(cx, cy - outerRadius);\n  ctx.closePath();\n  ctx.fillStyle = \"gold\";\n  ctx.fill();\n}\nfunction draw() {\n  ctx.clearRect(0, 0, canvas.width, canvas.height);\n  ctx.save();\n  ctx.translate(150, 150);\n  ctx.rotate(angle);\n  drawStar(0, 0, 5, 60, 30);\n  ctx.restore();\n  angle += 0.01;\n  requestAnimationFrame(draw);\n}\ndraw();\n</script></body></html>"
      },
      {// Interactive Animations	Cursor-Driven Movement with Scaling
        "prompt": "Generate a JavaScript animation of a square following the cursor with a slight lag during drag. While moving, the square should scale down by 10%, and once the user releases the mouse, it should stay at the final position.",
        "output": "<!DOCTYPE html>\n<html><body><canvas id=\"canvas\" width=\"600\" height=\"400\"></canvas><script>\nconst canvas = document.getElementById(\"canvas\");\nconst ctx = canvas.getContext(\"2d\");\n\nlet square = { x: 100, y: 100, size: 100, targetX: 100, targetY: 100 };\nlet isDragging = false;\n\ncanvas.addEventListener(\"mousedown\", (e) => {\n  isDragging = true;\n  updateTarget(e);\n});\ncanvas.addEventListener(\"mousemove\", (e) => {\n  if (isDragging) updateTarget(e);\n});\ncanvas.addEventListener(\"mouseup\", () => isDragging = false);\n\nfunction updateTarget(e) {\n  const rect = canvas.getBoundingClientRect();\n  square.targetX = e.clientX - rect.left - square.size / 2;\n  square.targetY = e.clientY - rect.top - square.size / 2;\n}\n\nfunction draw() {\n  ctx.clearRect(0, 0, canvas.width, canvas.height);\n  square.x += (square.targetX - square.x) * 0.1;\n  square.y += (square.targetY - square.y) * 0.1;\n\n  const scale = isDragging ? 0.9 : 1.0;\n  ctx.save();\n  ctx.translate(square.x + square.size / 2, square.y + square.size / 2);\n  ctx.scale(scale, scale);\n  ctx.fillStyle = \"blue\";\n  ctx.fillRect(-square.size / 2, -square.size / 2, square.size, square.size);\n  ctx.restore();\n\n  requestAnimationFrame(draw);\n}\ndraw();\n</script></body></html>"
      },
      { //Sequencing & Chaining	Color Transition → Rotation

        "prompt": "Generate a JavaScript animation where a rectangle changes color from red to green and then rotates 360 degrees.",
        "output": "<!DOCTYPE html>\n<html><body><canvas id=\"canvas\" width=\"400\" height=\"300\"></canvas><script>\nconst canvas = document.getElementById(\"canvas\");\nconst ctx = canvas.getContext(\"2d\");\n\nlet angle = 0;\nlet progress = 0;\nlet phase = \"color\";\n\nfunction interpolateColor(p) {\n  const r = Math.floor(255 * (1 - p));\n  const g = Math.floor(255 * p);\n  return `rgb(${r},${g},0)`;\n}\n\nfunction draw() {\n  ctx.clearRect(0, 0, canvas.width, canvas.height);\n  ctx.save();\n  ctx.translate(200, 150);\n\n  if (phase === \"color\") {\n    ctx.fillStyle = interpolateColor(progress);\n    ctx.fillRect(-50, -25, 100, 50);\n    progress += 0.01;\n    if (progress >= 1) {\n      progress = 0;\n      phase = \"rotate\";\n    }\n  } else if (phase === \"rotate\") {\n    ctx.rotate(angle);\n    ctx.fillStyle = \"green\";\n    ctx.fillRect(-50, -25, 100, 50);\n    angle += 0.05;\n    if (angle >= 2 * Math.PI) {\n      angle = 2 * Math.PI;\n    }\n  }\n\n  ctx.restore();\n  if (angle < 2 * Math.PI) requestAnimationFrame(draw);\n}\ndraw();\n</script></body></html>"
      }
    ];
    
    const messages = [
      {
        role: "system",
        content: instructions,
      },
      ...fewShotExamples.flatMap(example => [
        {
          role: "user",
          content: `Prompt: ${example.prompt}`,
        },
        {
          role: "assistant",
          content: example.output,
        }
      ]),
      {
        role: "user",
        content: `Prompt: ${prompt}`,
      }
    ];

    // Set up Ollama streaming
    const response = await ollama.chat({
      model: process.env.MODEL_NAME as string,
      messages,
      stream: true,
      options: { ...options },
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
