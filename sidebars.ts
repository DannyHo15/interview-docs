import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Sidebar structure for the Interview Notes site.
 * Docusaurus strips leading numeric prefixes from doc ids
 * (e.g. `01-databases.md` -> id `backend/databases`).
 */
const sidebars: SidebarsConfig = {
  studyPlanSidebar: [
    {
      type: 'category',
      label: '📅 Study Plan',
      items: ['study-plan'],
    },
  ],

  backendSidebar: [
    {
      type: 'category',
      label: 'Backend',
      link: {type: 'doc', id: 'backend/index'},
      items: [
        'backend/databases',
        'backend/concurrency',
        'backend/networking-http',
        'backend/api-design',
        'backend/caching',
        'backend/security',
        'backend/microservices-distributed',
        'backend/reliability-scalability',
      ],
    },
  ],

  frontendSidebar: [
    {
      type: 'category',
      label: 'Frontend',
      link: {type: 'doc', id: 'frontend/index'},
      items: [
        'frontend/react-core',
        'frontend/state-management',
        'frontend/performance',
        'frontend/typescript',
        'frontend/styling-css',
        'frontend/browser-network',
        'frontend/accessibility-testing',
        'frontend/data-fetching',
      ],
    },
  ],

  reactNativeSidebar: [
    {
      type: 'category',
      label: 'React Native',
      link: {type: 'doc', id: 'react-native/index'},
      items: [
        'react-native/core-fundamentals',
        'react-native/navigation-state',
        'react-native/performance',
        'react-native/architecture-clean-code',
        'react-native/native-build-deploy',
        'react-native/device-integrations',
        'react-native/debugging-testing',
      ],
    },
  ],

  systemDesignSidebar: [
    {
      type: 'category',
      label: 'System Design',
      link: {type: 'doc', id: 'system-design/index'},
      items: [
        'system-design/solving-framework',
        {
          type: 'category',
          label: 'Câu hỏi kinh điển',
          items: [
            'system-design/questions/url-shortener',
            'system-design/questions/twitter-newsfeed',
            'system-design/questions/rate-limiter',
            'system-design/questions/pastebin',
            'system-design/questions/distributed-cache',
            'system-design/questions/key-value-store',
            'system-design/questions/message-queue',
            'system-design/questions/search-autocomplete',
            'system-design/questions/web-crawler',
            'system-design/questions/chat-whatsapp',
            'system-design/questions/notification-system',
            'system-design/questions/youtube-streaming',
            'system-design/questions/google-drive',
            'system-design/questions/uber-ride',
            'system-design/questions/leaderboard',
          ],
        },
      ],
    },
  ],

  algorithmsSidebar: [
    {
      type: 'category',
      label: 'Algorithms & Data Structures',
      link: {type: 'doc', id: 'algorithms/index'},
      items: [
        'algorithms/problem-solving-framework',
        'algorithms/arrays-strings',
        'algorithms/linked-lists-stacks-queues',
        'algorithms/trees-graphs',
        'algorithms/dynamic-programming',
        'algorithms/intervals-greedy',
        'algorithms/bit-manipulation-math',
      ],
    },
  ],

  frontendSystemDesignSidebar: [
    {
      type: 'category',
      label: 'Frontend System Design',
      link: {type: 'doc', id: 'frontend-system-design/index'},
      items: [
        'frontend-system-design/framework',
        'frontend-system-design/news-feed',
        'frontend-system-design/video-player',
        'frontend-system-design/collaborative-editor',
        'frontend-system-design/dashboard',
        'frontend-system-design/component-library',
      ],
    },
  ],

  devopsSidebar: [
    {
      type: 'category',
      label: 'DevOps & Cloud',
      link: {type: 'doc', id: 'devops/index'},
      items: [
        'devops/docker',
        'devops/cicd',
        'devops/monitoring',
        'devops/cloud-services',
        'devops/infrastructure',
      ],
    },
  ],

  behavioralSidebar: [
    {
      type: 'category',
      label: 'Behavioral & Leadership',
      link: {type: 'doc', id: 'behavioral/index'},
      items: [
        'behavioral/star-method',
        'behavioral/common-questions',
        'behavioral/leadership',
        'behavioral/conflict-failure',
        'behavioral/negotiation',
      ],
    },
  ],

  cvSidebar: [
    {
      type: 'category',
      label: 'CV & Phỏng vấn',
      items: [
        'cv/cv-deep-dive',
        'cv/alphasphere-fullstack',
        'cv/interview_prep_optisigns_vi',
        'cv/cmc-global-ai-solution',
        'cv/interview_prep_fpt_telecom',
        'cv/interview_prep_vnggames',
        'cv/evn-genco3-techniques',
        'cv/project-inspectai',
        'cv/project-gencodify',
        'cv/project-ai-communication',
      ],
    },
  ],

  dataDashboardSidebar: [
    {
      type: 'category',
      label: 'Data Dashboard',
      link: {type: 'doc', id: 'data-dashboard/index'},
      items: [
        'data-dashboard/charting-libraries',
        'data-dashboard/large-datasets',
        'data-dashboard/sql-for-dashboards',
      ],
    },
  ],

  aiEngineeringSidebar: [
    {
      type: 'category',
      label: 'AI Engineering',
      link: {type: 'doc', id: 'ai-engineering/index'},
      items: [
        'ai-engineering/llm-fundamentals',
        'ai-engineering/prompt-engineering',
        'ai-engineering/rag',
        'ai-engineering/agents-tool-calling',
        'ai-engineering/evaluation-guardrails-production',
        'ai-engineering/streaming-multi-provider',
        'ai-engineering/fine-tuning',
      ],
    },
  ],

  pocSidebar: [
    {
      type: 'category',
      label: 'PoC AI Builder',
      link: {type: 'doc', id: 'poc-ai-builder/index'},
      items: [],
    },
  ],

  caseStudiesSidebar: [
    {
      type: 'category',
      label: 'Bài toán thực tế',
      link: {type: 'generated-index', slug: '/case-studies'},
      items: [
        'case-studies/upload-large-csv',
        'case-studies/bulk-insert-db',
        'case-studies/realtime-updates',
        'case-studies/deep-pagination',
        'case-studies/idempotent-api',
        'case-studies/cache-invalidation-stampede',
        'case-studies/presigned-url-upload',
      ],
    },
  ],
};

export default sidebars;
