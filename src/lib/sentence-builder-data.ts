
export interface Sentence {
  words: string[];
  correct: string;
  hint: string;
  translation: string;
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
        hint: "Who does the action?",
        translation: "මම ඇපල් කනවා"
      },
      {
        words: ["She", "a", "reads", "book"],
        correct: "She reads a book",
        hint: "The action word is 'reads'.",
        translation: "ඇය පොතක් කියවනවා"
      },
      {
        words: ["They", "play", "football"],
        correct: "They play football",
        hint: "Start with 'They'.",
        translation: "ඔවුන් පාපන්දු ක්‍රීඩා කරනවා"
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
        hint: "The adjective 'red' comes before the noun 'car'.",
        translation: "ඇය රතු මෝටර් රථයක් මිලදී ගත්තා"
      },
      {
        words: ["He", "a", "wears", "shirt", "blue"],
        correct: "He wears a blue shirt",
        hint: "What color is the shirt?",
        translation: "ඔහු නිල් කමිසයක් අඳිනවා"
      },
      {
        words: ["We", "ate", "a", "pizza", "delicious"],
        correct: "We ate a delicious pizza",
        hint: "How was the pizza?",
        translation: "අපි රසවත් පීසා එකක් කෑවා"
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
        hint: "Questions often start with 'Wh-' words.",
        translation: "ඔයා මොනවද කරන්නේ"
      },
      {
        words: ["is", "your", "name", "What"],
        correct: "What is your name",
        hint: "This is a common greeting question.",
        translation: "ඔයාගේ නම කුමක්ද"
      },
      {
        words: ["from", "Where", "you", "are"],
        correct: "Where are you from",
        hint: "Start with the word 'Where'.",
        translation: "ඔබ කොහේ සිට ද"
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
        hint: "The helping verb 'did' comes before 'not'.",
        translation: "ඔවුන් පාසල් ගියේ නැහැ"
      },
      {
        words: ["is", "He", "a", "not", "doctor"],
        correct: "He is not a doctor",
        hint: "'not' comes after the verb 'is'.",
        translation: "ඔහු වෛද්‍යවරයෙක් නොවේ"
      },
      {
        words: ["I", "like", "do", "not", "spiders"],
        correct: "I do not like spiders",
        hint: "Use the helping verb 'do'.",
        translation: "මම මකුළුවන්ට කැමති නැහැ"
      },
    ]
  },
  {
    level: 5,
    pattern: "Compound Sentences",
    sentences: [
      {
        words: ["I", "coffee", "like", "but", "I", "prefer", "tea"],
        correct: "I like coffee but I prefer tea",
        hint: "'but' connects two opposite ideas.",
        translation: "මම කෝපි වලට කැමතියි නමුත් මම තේ වලට වැඩි කැමැත්තක් දක්වනවා"
      },
      {
        words: ["She", "to", "went", "the", "and", "store", "bought", "milk", "she"],
        correct: "She went to the store and she bought milk",
        hint: "'and' connects two related actions.",
        translation: "ඇය සාප්පුවට ගොස් කිරි මිලදී ගත්තාය"
      },
      {
        words: ["He", "study", "will", "or", "he", "watch", "will", "TV"],
        correct: "He will study or he will watch TV",
        hint: "'or' presents a choice.",
        translation: "ඔහු පාඩම් කරයි නැතහොත් රූපවාහිනිය නරඹනු ඇත"
      },
    ]
  }
];
