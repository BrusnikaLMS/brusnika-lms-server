import type { CourseApp } from '@course-studio/player'

export const DEMO_COURSE: CourseApp = {
  id: 'demo-app-001',
  version: '1.0.0',
  title: 'Course Studio Demo',
  description: 'A demo learning app showcasing the App > Screens architecture.',
  language: 'en',
  settings: {
    showResults: true,
    allowNavigation: 'linear',
    completionCriteria: 'allScreens',
    passingScore: 70,
  },
  state: {
    score: 0,
    videoFinished: false,
  },
  screens: [
    {
      id: 'screen-001',
      title: 'Welcome',
      components: [
        {
          id: 'c-001',
          type: 'text',
          content: '<h2>Welcome to Course Studio</h2><p>An open-source, AI-first no-code learning app builder — "Tilda для обучения". Build interactive learning apps, export to SCORM or embed anywhere in 2 clicks.</p>',
        },
        {
          id: 'c-002',
          type: 'image',
          src: 'https://placehold.co/800x400/5B5FED/white?text=Course+Studio',
          alt: 'Course Studio',
          caption: 'No-code learning app builder',
        },
      ],
      navigation: { next: 'screen-002' },
    },
    {
      id: 'screen-002',
      title: 'Single Choice Quiz',
      components: [
        {
          id: 'c-003',
          type: 'text',
          content: '<p>Let\'s check what you know about Course Studio.</p>',
        },
        {
          id: 'c-004',
          type: 'quiz-single',
          question: 'What is the primary content format used by Course Studio?',
          options: ['course.xml', 'course.json', 'course.yaml', 'SCORM package'],
          correct: 1,
          explanation: 'course.json is the open, git-friendly format. SCORM is only an export target.',
          feedback: {
            correct: 'Correct! course.json is the open format.',
            incorrect: 'Not quite — Course Studio uses course.json.',
          },
        },
      ],
      events: [
        {
          on: 'QUIZ_CORRECT',
          componentId: 'c-004',
          actions: [{ type: 'SET_STATE', key: 'score', value: '+1' }],
        },
      ],
      navigation: { prev: 'screen-001', next: 'screen-003' },
    },
    {
      id: 'screen-003',
      title: 'True / False',
      components: [
        {
          id: 'c-005',
          type: 'true-false',
          statement: 'Course Studio uses a timeline-based editor like Articulate Storyline.',
          correct: false,
          explanation: 'Course Studio uses a state + event architecture with a block editor — no timeline.',
        },
      ],
      events: [
        {
          on: 'QUIZ_CORRECT',
          componentId: 'c-005',
          actions: [{ type: 'SET_STATE', key: 'score', value: '+1' }],
        },
      ],
      navigation: { prev: 'screen-002', next: 'screen-004' },
    },
    {
      id: 'screen-004',
      title: 'Multiple Choice',
      components: [
        {
          id: 'c-006',
          type: 'quiz-multi',
          question: 'Which packages are open-source (AGPL-3.0)? Select all that apply.',
          options: ['player', 'editor', 'scorm-export', 'ai', 'embed-api'],
          correct: [0, 1, 2],
          explanation: 'player, editor, and scorm-export are AGPL-3.0. ai and embed-api are commercial.',
        },
      ],
      events: [
        {
          on: 'QUIZ_CORRECT',
          componentId: 'c-006',
          actions: [{ type: 'SET_STATE', key: 'score', value: '+1' }],
        },
      ],
      navigation: { prev: 'screen-003', next: 'screen-005' },
    },
    {
      id: 'screen-005',
      title: 'Flashcards',
      components: [
        {
          id: 'c-007',
          type: 'text',
          content: '<p>Click a card to flip it.</p>',
        },
        {
          id: 'c-008',
          type: 'flashcards',
          cards: [
            { front: 'SCORM', back: 'Sharable Content Object Reference Model — eLearning interoperability standard.' },
            { front: 'AGPL-3.0', back: 'GNU Affero General Public License — SaaS/embedded use requires open source or commercial license.' },
            { front: 'course.json', back: 'Open, git-friendly format used by Course Studio to store learning apps.' },
            { front: 'Learning App', back: 'Interactive application where learning happens through user actions, not passive content.' },
          ],
        },
      ],
      navigation: { prev: 'screen-004', next: 'screen-006' },
    },
    {
      id: 'screen-006',
      title: 'Branching Scenario',
      components: [
        {
          id: 'c-009',
          type: 'branching',
          scenario: 'A client wants to embed your learning course into their corporate portal without opening their source code. What do you offer?',
          choices: [
            {
              id: 'choice-a',
              label: 'Community (AGPL) license — free',
              consequence: 'AGPL requires them to open their source. They need a commercial license for embedding.',
            },
            {
              id: 'choice-b',
              label: 'Commercial embedding license',
              consequence: 'Correct! Commercial license lets them embed without open-sourcing their product.',
            },
            {
              id: 'choice-c',
              label: 'Just use an iframe, no license needed',
              consequence: 'Embedding via iframe still falls under AGPL if the software is used as a service.',
            },
          ],
        },
      ],
      navigation: { prev: 'screen-005' },
    },
  ],
}
