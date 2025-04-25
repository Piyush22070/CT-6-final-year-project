import Together from "together-ai";
import fs from "fs";

export async function ocr({
  filePath,
  apiKey = 'e98141a1fc36763d0c5654648333c5ed25f758cdd1ad1794fc1589cd92dd1c56',
  model = "Llama-3.2-90B-Vision",
}) {
  const visionLLM =
    model === "free"
      ? "meta-llama/Llama-Vision-Free"
      : `meta-llama/${model}-Instruct-Turbo`;

  const together = new Together({ apiKey });

  return await getMarkDown({ together, visionLLM, filePath });
}

async function getMarkDown({ together, visionLLM, filePath }) {
  const systemPrompt = `Convert the provided image into Markdown format. Ensure that all content from the page is included. Output only Markdown.`;

  const finalImageUrl = isRemoteFile(filePath)
    ? filePath
    : `data:image/jpeg;base64,${encodeImage(filePath)}`;

  const output = await together.chat.completions.create({
    model: visionLLM,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: systemPrompt },
          {
            type: "image_url",
            image_url: { url: finalImageUrl },
          },
        ],
      },
    ],
  });

  return output.choices[0].message.content;
}

function encodeImage(imagePath) {
  const imageFile = fs.readFileSync(imagePath);
  return Buffer.from(imageFile).toString("base64");
}

function isRemoteFile(filePath) {
  return filePath.startsWith("http://") || filePath.startsWith("https://");
}
