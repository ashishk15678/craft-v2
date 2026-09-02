import { prisma as db } from '../lib/db';

async function main() {
  const accentureTrack = await db.track.create({
    data: {
      title: 'Accenture Mass Hiring Prep',
      description: 'Comprehensive track to prepare for Accenture recruitment process. Covers quantitative aptitude, logical reasoning, verbal ability, and coding.',
      category: 'Mass Hiring',
      isPublic: true,
      modules: {
        create: [
          {
            title: 'Quantitative Aptitude',
            description: 'Time and work, speed and distance, probability, etc.',
            order: 1,
            items: {
              create: [
                {
                  title: 'Time & Work MCQ',
                  type: 'MCQ',
                  content: 'If A can do a piece of work in 10 days and B can do it in 15 days, how long will they take if they work together?',
                  data: JSON.stringify({ options: ['5 days', '6 days', '8 days', '10 days'], correct: 1 }),
                  order: 1
                },
                {
                  title: 'Speed & Distance MCQ',
                  type: 'MCQ',
                  content: 'A train moving at 60 km/hr crosses a pole in 9 seconds. What is the length of the train?',
                  data: JSON.stringify({ options: ['120m', '150m', '180m', '200m'], correct: 1 }),
                  order: 2
                }
              ]
            }
          },
          {
            title: 'Coding Questions',
            description: 'Common coding patterns asked in Accenture',
            order: 2,
            items: {
              create: [
                {
                  title: 'Find Second Largest Element',
                  type: 'CODING',
                  content: 'Write a function to find the second largest element in an array of integers.',
                  order: 1
                },
                {
                  title: 'Check Anagram',
                  type: 'CODING',
                  content: 'Given two strings, check if they are anagrams of each other.',
                  order: 2
                }
              ]
            }
          }
        ]
      }
    }
  });

  const tcsTrack = await db.track.create({
    data: {
      title: 'TCS NQT Preparation',
      description: 'Master the TCS NQT with puzzles, programming logic, and hands-on coding.',
      category: 'Mass Hiring',
      isPublic: true,
      modules: {
        create: [
          {
            title: 'Programming Logic',
            order: 1,
            items: {
              create: [
                {
                  title: 'Pseudo Code MCQ',
                  type: 'MCQ',
                  content: 'What will be the output of the following pseudocode?\nInteger a = 10, b = 20\na = a ^ b\nb = a ^ b\na = a ^ b\nPrint a, b',
                  data: JSON.stringify({ options: ['10 20', '20 10', '0 0', 'Error'], correct: 1 }),
                  order: 1
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
