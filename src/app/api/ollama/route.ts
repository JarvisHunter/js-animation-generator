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
        prompt: "Create an animation of a red triangle rolling from the top-left corner to the bottom-right corner.",
        output: `<!DOCTYPE html>
        <html>
        <body>
          <canvas id="canvas" width="400" height="300"></canvas>
          <script>
          const canvas = document.getElementById("canvas");
          const ctx = canvas.getContext("2d");

          let x = 20, y = 20, size = 20;
          let dx = 1.5, dy = 1.2;
          let angle = 0; // Added for rotation

          function drawTriangle() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          ctx.save(); // Save the current transformation matrix
          ctx.translate(x, y); // Move the origin to the triangle's center
          ctx.rotate(angle); // Rotate the triangle

          ctx.beginPath();
          ctx.moveTo(0, -size / 2); // Adjusted coordinates for rotation around the center
          ctx.lineTo(size / 2, size / 2);
          ctx.lineTo(-size / 2, size / 2);
          ctx.fillStyle = "red";
          ctx.fill();
          ctx.closePath();

          ctx.restore(); // Restore the transformation matrix

          x += dx;
          y += dy;
          angle += 0.05; // Increment the angle for rolling effect

          if (x < canvas.width - size / 2 && y < canvas.height - size / 2) {
          requestAnimationFrame(drawTriangle);
          }
          }
          drawTriangle();
          </script>
        </body>
        </html>`
      },
      { //Basic Motions	Linear Horizontal Movement
        prompt: "Move a green square from left to right in a loop.",
        output: `<!DOCTYPE html>
          <html>
            <body>
              <canvas id="canvas" width="400" height="100"></canvas>
              <script>
                const canvas = document.getElementById("canvas");
                const ctx = canvas.getContext("2d");
                let x = 0;
                function draw() {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.fillStyle = "green";
                  ctx.fillRect(x, 30, 50, 50);
                  x += 2;
                  if (x > canvas.width) x = -50;
                  requestAnimationFrame(draw);
                }
                draw();
              </script>
            </body>
          </html>`
      },
      { //Basic Motions	Vertical Bouncing
        prompt: "Animate a ball bouncing vertically inside a canvas.",
        output: `<!DOCTYPE html>
        <html>
        <head>
            <title>Bouncing Ball Animation</title>
            <style>
                canvas {
                    border: 2px solid #333;
                    background-color: #f0f0f0;
                }
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #fff;
                }
            </style>
        </head>
        <body><canvas id="bounceCanvas" width="600" height="400"></canvas>
            <script>
                const canvas = document.getElementById('bounceCanvas');
                const ctx = canvas.getContext('2d');
                const ball = {
                    x: canvas.width / 2,
                    y: 30,
                    radius: 30,
                    dy: 0,          // Vertical velocity
                    gravity: 0.5,
                    damping: 0.8     // Energy loss on bounce
                };
                function drawBall() {
                    ctx.beginPath();
                    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                    ctx.fillStyle = '#e74c3c';
                    ctx.fill();
                    ctx.closePath();
                }
                function updatePhysics() {
                    // Apply gravity
                    ball.dy += ball.gravity;
                    ball.y += ball.dy;
                    // Bottom boundary collision
                    if (ball.y + ball.radius > canvas.height) {
                        ball.y = canvas.height - ball.radius;
                        ball.dy *= -ball.damping;
                        // Stop animation when bouncing becomes barely noticeable
                        if (Math.abs(ball.dy) < 0.5) ball.dy = 0;
                    }
                    // Top boundary collision (optional)
                    if (ball.y - ball.radius < 0) {
                        ball.y = ball.radius;
                        ball.dy *= -ball.damping;
                    }
                }
                function animate() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawBall();
                    updatePhysics();
                    if (ball.dy !== 0) {
                        requestAnimationFrame(animate);
                    }
                }
                animate();
            </script></body></html>`
      },
      { //Color	Hue Rotation / Continuous Color Transition
        prompt: "Cycle background color through a rainbow spectrum over 10 seconds.",
        output: `<!DOCTYPE html>
        <html><body>
        <script>
        let hue = 0;
        function changeBackground() {
            document.body.style.backgroundColor = 'hsl(' + hue + ', 100%, 50%)';
            hue = (hue + 1) % 360;
            requestAnimationFrame(changeBackground);
          }
          changeBackground();
          </script></body></html>`
      },
      { //Transformations	Rotation
        prompt: "Rotate a star shape continuously around its center.",
        output: `<!DOCTYPE html>
        <html>
        <body><canvas id="canvas" width="300" height="300"></canvas>
        <script>
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        let angle = 0;
        function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
          let rot = Math.PI / 2 * 3;
          let x = cx;
          let y = cy;
          let step = Math.PI / spikes;
          ctx.beginPath();
          ctx.moveTo(cx, cy - outerRadius);
          for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
            }
          ctx.lineTo(cx, cy - outerRadius);
          ctx.closePath();
          ctx.fillStyle = "gold";
          ctx.fill();
        }
        function draw() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.translate(150, 150);
          ctx.rotate(angle);
          drawStar(0, 0, 5, 60, 30);
          ctx.restore();
          angle += 0.01;
          requestAnimationFrame(draw);
        }
        draw();
        </script></body></html>`
      },
      {// Interactive Animations	Cursor-Driven Movement with Scaling
        prompt: "Generate a JavaScript animation of a square following the cursor with a slight lag during drag. While moving, the square should scale down by 10%, and once the user releases the mouse, it should stay at the final position.",
        output: `<!DOCTYPE html>
        <html><body><canvas id="canvas" width="600" height="400"></canvas>
        <script>
          const canvas = document.getElementById("canvas");
          const ctx = canvas.getContext("2d");

          let square = { x: 100, y: 100, size: 100, targetX: 100, targetY: 100 };
          let isDragging = false;

          canvas.addEventListener("mousedown", (e) => {
            isDragging = true;
            updateTarget(e);
          });
          canvas.addEventListener("mousemove", (e) => {
            if (isDragging) updateTarget(e);
          });
          canvas.addEventListener("mouseup", () => (isDragging = false));

          function updateTarget(e) {
            const rect = canvas.getBoundingClientRect();
            square.targetX = e.clientX - rect.left - square.size / 2;
            square.targetY = e.clientY - rect.top - square.size / 2;
          }

          function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            square.x += (square.targetX - square.x) * 0.1;
            square.y += (square.targetY - square.y) * 0.1;

            const scale = isDragging ? 0.9 : 1.0;
            ctx.save();
            ctx.translate(square.x + square.size / 2, square.y + square.size / 2);
            ctx.scale(scale, scale);
            ctx.fillStyle = "blue";
            ctx.fillRect(-square.size / 2, -square.size / 2, square.size, square.size);
            ctx.restore();

            requestAnimationFrame(draw);
          }
          draw();
        </script></body></html>`
      },
      { //Sequencing & Chaining	Color Transition → Rotation
        prompt: "Generate a JavaScript animation where a rectangle changes color from red to green and then rotates 360 degrees.",
        output: `<!DOCTYPE html>
        <html>
          <body>
            <canvas id="canvas" width="400" height="300"></canvas>
            <script>
              const canvas = document.getElementById("canvas");
              const ctx = canvas.getContext("2d");

              let angle = 0;
              let progress = 0;
              let phase = "color"; // Can be "color" or "rotate"

              function interpolateColor(p) {
                const r = Math.floor(255 * (1 - p)); // Red decreases as p increases
                const g = Math.floor(255 * p);      // Green increases as p increases
                return 'rgb(' + [r, g, 0].join(',') + ')';          // Blue is always 0
              }

              function draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save(); // Save the current canvas state
                ctx.translate(200, 150); // Move the origin to the center of the canvas (400/2, 300/2)

                if (phase === "color") {
                  ctx.fillStyle = interpolateColor(progress);
                  ctx.fillRect(-50, -25, 100, 50); // Draw a rectangle centered at the new origin
                  progress += 0.01;
                  if (progress >= 1) {
                    progress = 0; // Reset progress
                    phase = "rotate"; // Switch to the rotation phase
                  }
                } else if (phase === "rotate") {
                  ctx.rotate(angle); // Rotate the canvas context
                  ctx.fillStyle = "green"; // Set fill to green for rotation phase
                  ctx.fillRect(-50, -25, 100, 50); // Draw the rotated rectangle
                  angle += 0.05; // Increment rotation angle
                  if (angle >= 2 * Math.PI) { // If a full circle (360 degrees) is completed
                    angle = 2 * Math.PI; // Stop further rotation by capping the angle
                    // The animation will stop here because of the condition in requestAnimationFrame
                  }
                }

                ctx.restore(); // Restore the canvas state to before translate/rotate

                // Continue animation only if the rotation phase is not fully complete
                if (angle < 2 * Math.PI) {
                  requestAnimationFrame(draw);
                }
              }
    draw(); 
    </script></body></html>`
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
