'use client'

import React, { useState, useEffect, useRef, use } from "react";
import styles from "./styles_page.module.scss";
import { AnimationData } from "./types";

interface QuestionFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}


// Add this function to extract HTML from the response
const extractHtml = (text: any) => {
    // Try to find HTML within code blocks
    const codeBlockMatch = text.match(/```(?:html)?\s*(<!DOCTYPE html>[\s\S]*?)<\/html>\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1] + '</html>';
    }
    
    // Try to find standalone HTML
    const htmlMatch = text.match(/(<!DOCTYPE html>[\s\S]*?<\/html>)/i);
    if (htmlMatch && htmlMatch[1]) {
      return htmlMatch[1];
    }
    
    // Try to find just an HTML tag without DOCTYPE
    const basicHtmlMatch = text.match(/(<html>[\s\S]*?<\/html>)/i);
    if (basicHtmlMatch && basicHtmlMatch[1]) {
      return '<!DOCTYPE html>' + basicHtmlMatch[1];
    }
    
    // If nothing else works, check if there's a <body> tag
    const bodyMatch = text.match(/(<body>[\s\S]*?<\/body>)/i);
    if (bodyMatch && bodyMatch[1]) {
      return '<!DOCTYPE html><html>' + bodyMatch[1] + '</html>';
    }
    
    // Return the text as-is if no HTML patterns found
    return text;
};

const QuestionField: React.FC<QuestionFieldProps> = ({label, name, value, onChange}) => (
  <label>
    {label}
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      className={styles.input}
    />
  </label>
);


export default function ChatPage() {

  const [formData, setFormData] = useState<AnimationData>({} as AnimationData);
  const [response, setResponse] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const accumulatedContent = useRef(""); 

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    console.log(name, value);
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const compulsoryFields: (keyof AnimationData)[] = [
      "general_instruction",
      "elements",
      "animation_details",
      "timing_easing",
      "triggering"
    ];
  
    // Check if any compulsory field is missing
    for (const field of compulsoryFields) {
      if (!formData[field]) {
        alert(`Please fill in the ${field.replace('_', ' ')} field.`);
        return;
      }
    }
  

    setLoading(true);
    console.log("submitted");
    setResponse(""); // Reset UI
    accumulatedContent.current = ""; // Reset ref storage

    try {
      const apiResponse = await fetch('/api/ollama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!apiResponse.ok) {
        throw new Error('API request failed');
      }

      const reader = apiResponse.body?.getReader();
      const decoder = new TextDecoder();
      let lastUpdateTime = Date.now();

      while (true) {
        const { value, done } = await reader?.read() || {};
        if (done) break;

        const text = decoder.decode(value);
        // console.log('Received chunk:', text);

        try {
          const jsonChunks = text.split("\n\n").filter(Boolean);

          for (const jsonChunk of jsonChunks) {
            if (jsonChunk.startsWith("data:")) {
              const data = JSON.parse(jsonChunk.substring(5)); // Remove "data:"

              if (data.chunk) {
                accumulatedContent.current += data.chunk; // Append instead of replacing

                // Throttle updates (every 500ms) to avoid excessive renders
                const currentTime = Date.now();
                if (currentTime - lastUpdateTime >= 150) {
                  requestAnimationFrame(() => {
                    setResponse(accumulatedContent.current); // Smooth UI update
                  });
                  lastUpdateTime = currentTime; // Reset update timer
                }
              }

              if (data.done) {
                setResponse(accumulatedContent.current); // Final update
                setLoading(false);
                break;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing JSON chunk:', e);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      
    }
  };

   const handleCopyCode = () => {
    const htmlCode = response;
    navigator.clipboard.writeText(htmlCode)
      .then(() => {
        setCopySuccess(true);
        // Reset success message after 2 seconds
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <div className={styles.chat_container}>
      <div className={styles.leftPanel}>
        <h1 className={styles.title}>JavaScript Animation Generator</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
        <QuestionField
        label="General Instructions:"
        name="general_instruction"
        value={formData.general_instruction || ""}
        onChange={handleChange}
      />
      <QuestionField
        label="Which HTML elements will be animated?"
        name="elements"
        value={formData.elements || ""}
        onChange={handleChange}
      />
      <QuestionField
        label="What specific animations would you like to apply to the elements?"
        name="animation_details"
        value={formData.animation_details || ""}
        onChange={handleChange}
      />
      <QuestionField
        label="What is the duration of the animation, and which easing function would you like to use?"
        name="timing_easing"
        value={formData.timing_easing || ""}
        onChange={handleChange}
      />
      <QuestionField
        label="How should the animation be triggered?"
        name="triggering"
        value={formData.triggering || ""}
        onChange={handleChange}
      />
      <QuestionField
        label="Are there any specific HTML structure or CSS selectors to target for this animation? (optional)"
        name="html_structure"
        value={formData.html_structure || ""}
        onChange={handleChange}
      />
      <QuestionField
        label="Should the animation adapt based on different screen sizes or devices? (optional)"
        name="responsive_behavior"
        value={formData.responsive_behavior || ""}
        onChange={handleChange}
      />
      <QuestionField
        label="Should the animations occur sequentially or simultaneously? (optional)"
        name="animation_sequence"
        value={formData.animation_sequence || ""}
        onChange={handleChange}
      />
      <QuestionField
        label="Should the animation repeat or loop, and if so, how many times or under what condition? (optional)"
        name="repeat_behavior"
        value={formData.repeat_behavior || ""}
        onChange={handleChange}
        />
        <QuestionField
          label="Do you want to add any extra effects or callbacks to your animation? (optional)"
          name="additional_effects"
          value={formData.additional_effects || ""}
          onChange={handleChange}
        />
        <QuestionField
          label="Would you like any debugging or logging features for the animation? (optional)"
          name="debugging_logging"
          value={formData.debugging_logging || ""}
          onChange={handleChange}
        />
        <QuestionField
          label="Are there any fallback mechanisms needed for unsupported browsers or environments? (optional)"
          name="fallbacks"
          value={formData.fallbacks || ""}
          onChange={handleChange}
        />
        <QuestionField
          label="Should users be able to control the animation? (optional)"
          name="user_controls"
          value={formData.user_controls || ""}
          onChange={handleChange}
        />
        <QuestionField
          label="Does the animation involve transitioning between different states? (optional)"
          name="transitions_states"
          value={formData.transitions_states || ""}
          onChange={handleChange}
        />
        <QuestionField
          label="Are there any style limitations or constraints for the animation? (optional)"
          name="style_constraints"
          value={formData.style_constraints || ""}
          onChange={handleChange}
        />
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Generating..." : "Generate Animation"}
        </button>
        </form>
      </div>
      <div className={styles.rightPanel}>
      { loading ? 
            <h2>Generating Animation...</h2> : 
            <>
              <h2>Generated Animation:</h2>
              {response && !loading && (
                <button 
                  onClick={handleCopyCode}
                  className={styles.copy_button}
                  disabled={copySuccess}
                >
                  {copySuccess ? 'Copied!' : 'Copy Code'}
                </button>
              )}
            </>
          }
        {
          loading ? <div style={{ width: "100%", height: "100%", border: "1px solid #ccc", backgroundColor: "#fff" }}>{response}</div> :
          <iframe
            srcDoc={extractHtml(response)}
            style={{ width: "100%", height: "100%", border: "1px solid #ccc", backgroundColor: "#fff" }}
            title="Generated Animation"
          ></iframe>
        }
      </div>
    </div>
  );
}
