import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Sidebar structure for the Interview Notes site.
 * Docusaurus strips leading numeric prefixes from doc ids
 * (e.g. `01-databases.md` -> id `backend/databases`).
 */
const sidebars: SidebarsConfig = {
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

  cvSidebar: [
    {
      type: 'category',
      label: 'CV & Phỏng vấn',
      items: ['cv/cv-deep-dive', 'cv/cmc-global-ai-solution'],
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
};

export default sidebars;
