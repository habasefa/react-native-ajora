import { v4 as uuidv4 } from "uuid";

export const mockResponseText = `
# Machine Learning (ML)

Machine Learning is a subfield of **Artificial Intelligence (AI)** focused on creating systems that **learn from data** rather than being explicitly programmed. Instead of following fixed instructions, an ML system **identifies patterns and relationships** in data and uses them to **make predictions, decisions, or classifications** on new, unseen data.

---

## Core Idea

Machine learning involves three main components:

1. **Data** – Observations or measurements (structured or unstructured) used to train the model.  
2. **Model** – A mathematical representation (like a function) that maps inputs to outputs.  
3. **Learning Algorithm** – A method for adjusting the model’s internal parameters based on data to reduce errors.

  

## Types of Machine Learning

### 1. Supervised Learning
- **Goal:** Learn a mapping from inputs to known outputs (labeled data).  
- **Examples:** Predicting house prices, spam email detection.  
- **Common Algorithms:** Linear Regression, Support Vector Machine (SVM), Random Forest, Neural Networks.

### 2. Unsupervised Learning
- **Goal:** Discover hidden structure in unlabeled data.  
- **Examples:** Customer segmentation, topic discovery in text.  
- **Common Algorithms:** K-means clustering, Principal Component Analysis (PCA).

### 3. Reinforcement Learning
- **Goal:** Learn actions that maximize cumulative rewards through trial and error.  
- **Examples:** Game-playing agents, robotics control.  
- **Key Concepts:** Markov Decision Process (MDP), rewards, states, and actions.




## Typical Machine Learning Workflow

1. **Data collection and cleaning**  
2. **Feature engineering** (selecting or transforming variables)  
3. **Model selection and training**  
4. **Model evaluation** (metrics: accuracy, precision, recall, etc.)  
5. **Deployment and monitoring**


## Challenges

- **Overfitting** – Model memorizes training data instead of generalizing  
- **Bias and fairness issues**  
- **Data quality and quantity requirements**  
- **Interpretability of complex models**


## Relation to Other Fields

- ML is a **subset of AI**, focused on learning from data.  
- Relies heavily on **Statistics**, **Linear Algebra**, **Probability Theory**, and **Computer Science**.


> Optional: A real-world example (e.g., predicting house prices) can show how the full process works in practice.
`.split("");

export const mockThreadTitle = "Machine Learning (ML)";

/* Mock response */
export const mockGen = async function* () {
  let finalText = "";
  for (const chunk of mockResponseText) {
    // Add a small delay between chunks to simulate streaming latency
    await new Promise((resolve) => setTimeout(resolve, 100));
    finalText += chunk;
    // Simulate Google GenAI response format
    yield {
      candidates: [
        {
          content: {
            role: "model",
            parts: [{ text: chunk }],
          },
        },
      ],
    };
  }
};
