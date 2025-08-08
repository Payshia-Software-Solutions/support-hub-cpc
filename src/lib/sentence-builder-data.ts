
export interface Sentence {
  words: string[];
  correct: string;
  hint: string;
}

export interface GameLevel {
  level: number;
  pattern: string;
  sentences: Sentence[];
}

export const gameLevels: GameLevel[] = [
  {
    level: 1,
    pattern: "S + V + O (Simple Present)",
    sentences: [
      {
        words: ["I", "apples", "eat"],
        correct: "I eat apples",
        hint: "Who does the action?"
      },
      {
        words: ["She", "a", "reads", "book"],
        correct: "She reads a book",
        hint: "The action word is 'reads'."
      },
      {
        words: ["They", "play", "football"],
        correct: "They play football",
        hint: "Start with 'They'."
      },
    ]
  },
  {
    level: 2,
    pattern: "S + V + Adj + O",
    sentences: [
      {
        words: ["bought", "a", "car", "She", "red"],
        correct: "She bought a red car",
        hint: "The adjective 'red' comes before the noun 'car'."
      },
      {
        words: ["He", "a", "wears", "shirt", "blue"],
        correct: "He wears a blue shirt",
        hint: "What color is the shirt?"
      },
      {
        words: ["We", "ate", "a", "pizza", "delicious"],
        correct: "We ate a delicious pizza",
        hint: "How was the pizza?"
      },
    ]
  },
  {
    level: 3,
    pattern: "Question Form",
    sentences: [
      {
        words: ["doing", "What", "are", "you"],
        correct: "What are you doing",
        hint: "Questions often start with 'Wh-' words."
      },
      {
        words: ["is", "your", "name", "What"],
        correct: "What is your name",
        hint: "This is a common greeting question."
      },
      {
        words: ["from", "Where", "you", "are"],
        correct: "Where are you from",
        hint: "Start with the word 'Where'."
      },
    ]
  },
  {
    level: 4,
    pattern: "Negative Sentences",
    sentences: [
      {
        words: ["not", "go", "did", "They", "school", "to"],
        correct: "They did not go to school",
        hint: "The helping verb 'did' comes before 'not'."
      },
      {
        words: ["is", "He", "a", "not", "doctor"],
        correct: "He is not a doctor",
        hint: "'not' comes after the verb 'is'."
      },
      {
        words: ["I", "like", "do", "not", "spiders"],
        correct: "I do not like spiders",
        hint: "Use the helping verb 'do'."
      },
    ]
  },
  {
    level: 5,
    pattern: "Compound Sentences",
    sentences: [
      {
        words: ["I", "coffee", "like", "but", "I", "tea", "prefer"],
        correct: "I like coffee but I prefer tea",
        hint: "'but' connects two opposite ideas."
      },
      {
        words: ["She", "to", "went", "the", "and", "store", "bought", "milk", "she"],
        correct: "She went to the store and she bought milk",
        hint: "'and' connects two related actions."
      },
      {
        words: ["He", "study", "will", "or", "he", "watch", "will", "TV"],
        correct: "He will study or he will watch TV",
        hint: "'or' presents a choice."
      },
    ]
  }
];
