import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const SECTIONS = [
  {to: '/docs/backend', label: 'Backend', desc: 'DB, concurrency, API, caching, security, microservices…'},
  {to: '/docs/frontend', label: 'Frontend', desc: 'React, state, performance, TypeScript, styling…'},
  {to: '/docs/react-native', label: 'React Native', desc: 'Core, navigation, performance, architecture…'},
  {to: '/docs/system-design', label: 'System Design', desc: 'Framework + 15 câu hỏi kinh điển'},
  {to: '/docs/cv/cv-deep-dive', label: 'CV & Phỏng vấn', desc: 'Deep-dive theo CV'},
  {to: '/docs/poc-ai-builder', label: 'PoC AI Builder', desc: 'Project walkthrough'},
];

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/backend">
            Bắt đầu học 🚀
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Tài liệu ôn phỏng vấn kỹ thuật">
      <HomepageHeader />
      <main style={{padding: '2rem 0'}}>
        <div className="container">
          <div className="row" style={{gap: '1rem 0'}}>
            {SECTIONS.map((s) => (
              <div key={s.to} className="col col--4" style={{marginBottom: '1rem'}}>
                <Link to={s.to} className="card padding--lg">
                  <Heading as="h3">{s.label}</Heading>
                  <p>{s.desc}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
}
