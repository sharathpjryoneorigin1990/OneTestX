"use client";

import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8 } },
};

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);
  return (
    <>
      <NewNavbar />
      <div className="relative min-h-screen bg-gradient-to-b from-dark-900 to-dark-950">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="container mx-auto max-w-6xl relative text-center">
            
            {/* Animated background elements */}
            <motion.div 
              className="absolute -top-32 -right-32 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: 'reverse' as const,
              }}
            />
            <motion.div 
              className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: 'reverse' as const,
                delay: 1
              }}
            />
            
            <motion.div
              initial="hidden"
              animate="show"
              variants={container}
              className="text-center relative z-10"
            >
              <div className="mb-6">
                <motion.h1 
                  className="text-4xl md:text-6xl font-bold"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { 
                      opacity: 1, 
                      y: 0,
                      transition: { 
                        type: 'spring',
                        stiffness: 100,
                        damping: 10
                      } 
                    }
                  }}
                >
                  <span className="gradient-text text-5xl md:text-7xl font-extrabold">OneTest</span>{' '}
                  <span className="text-white text-5xl md:text-7xl font-extrabold">X</span>
                </motion.h1>
              </div>
              <div className="text-2xl md:text-4xl font-semibold mb-8 h-16">
                <TypewriterText
                  sequences={[
                    'Next-gen testing, simplified.',
                    1500,
                    'AI-powered test automation.',
                    1500,
                    'One platform, infinite tests.',
                    1500,
                    'Quality at the speed of X.',
                    1500,
                  ]}
                  className="text-white"
                />
              </div>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10">
                <span className="font-semibold text-white">Ship Better Code, Faster.</span> OneOrigin's AI-powered testing platform 
                automates 80% of your testing efforts while catching 90% more bugs before production. 
                From unit to load testing—deliver flawless software at the speed of DevOps.
              </p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { 
                    opacity: 1, 
                    y: 0,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 1.2, // Slight delay to let the text animation finish
                      when: "beforeChildren"
                    }
                  }
                }}
                initial="hidden"
                animate="show"
              >
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { 
                      opacity: 1, 
                      y: 0,
                      transition: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 15,
                      }
                    }
                  }}
                  whileHover={{ 
                    y: -3,
                    scale: 1.02,
                    transition: { 
                      type: 'spring',
                      stiffness: 400,
                      damping: 10
                    } 
                  }}
                  whileTap={{ 
                    scale: 0.98,
                    transition: { 
                      duration: 0.2 
                    } 
                  }}
                >
                  <Link href="/signup">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto relative overflow-hidden group"
                    >
                      <span className="relative z-10">Get Started Free</span>
                      <motion.span 
                        className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 opacity-0 group-hover:opacity-100"
                        initial={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </Button>
                  </Link>
                </motion.div>
                
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { 
                      opacity: 1, 
                      y: 0,
                      transition: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 15,
                        delay: 0.1
                      }
                    }
                  }}
                  whileHover={{ 
                    y: -3,
                    scale: 1.02,
                    transition: { 
                      type: 'spring',
                      stiffness: 400,
                      damping: 10
                    } 
                  }}
                  whileTap={{ 
                    scale: 0.98,
                    transition: { 
                      duration: 0.2 
                    } 
                  }}
                >
                  <Link href="/demo">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="w-full sm:w-auto relative group"
                    >
                      <span className="relative z-10 flex items-center">
                        <PlayCircle className="w-5 h-5 mr-2" />
                        View Demo
                      </span>
                      <motion.span 
                        className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 opacity-0 group-hover:opacity-100 rounded-md"
                        initial={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-900/50">
          <div className="container mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-primary-500 font-semibold text-lg mb-2 block">WHY CHOOSE US</span>
              <h2 className="text-4xl font-bold mb-4">Powerful Testing Capabilities</h2>
              <p className="text-gray-300 max-w-3xl mx-auto text-lg">
                OneTest X provides everything you need to manage your testing workflow efficiently across multiple frameworks and environments.
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
            >
              {[
                {
                  icon: '🧪',
                  title: 'Multiple Environments',
                  description: 'Seamlessly run tests across QA, Staging, and Production environments with environment-specific configurations.',
                },
                {
                  icon: '🔍',
                  title: 'Comprehensive Test Types',
                  description: 'Support for Unit, Integration, E2E, Performance, and custom test flows - all in one platform.',
                },
                {
                  icon: '📊',
                  title: 'Real-time Analytics',
                  description: 'Get instant insights with beautiful dashboards and detailed test execution reports.',
                },
                {
                  icon: '🤖',
                  title: 'AI-Powered Testing',
                  description: 'Leverage AI to generate, optimize, and maintain your test cases automatically.',
                },
                {
                  icon: '⚡',
                  title: 'Lightning Fast Execution',
                  description: 'Run tests in parallel across multiple browsers and devices for maximum efficiency.',
                },
                {
                  icon: '🔄',
                  title: 'CI/CD Integration',
                  description: 'Seamless integration with popular CI/CD tools like GitHub Actions, Jenkins, and GitLab CI.',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card p-8 hover:bg-dark-800/50 transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* How It Works Section */}
            <div className="mt-20">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <span className="text-primary-500 font-semibold text-lg mb-2 block">HOW IT WORKS</span>
                <h2 className="text-4xl font-bold mb-4">Get Started in Minutes</h2>
                <p className="text-gray-300 max-w-3xl mx-auto text-lg">
                  Integrate OneTest X into your workflow with just a few simple steps.
                </p>
              </motion.div>

              <motion.div 
                className="grid md:grid-cols-3 gap-8 relative"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="absolute left-1/2 top-1/2 h-2/3 w-0.5 bg-gradient-to-b from-primary-500/30 to-transparent -translate-x-1/2 -translate-y-1/2 hidden md:block"></div>
                
                {[
                  {
                    step: '1',
                    title: 'Connect Your Project',
                    description: 'Link your GitHub, GitLab, or Bitbucket repository in just a few clicks.',
                    icon: '🔌'
                  },
                  {
                    step: '2',
                    title: 'Configure Your Tests',
                    description: 'Set up your test configurations, environments, and parameters using our intuitive interface.',
                    icon: '⚙️'
                  },
                  {
                    step: '3',
                    title: 'Run & Analyze',
                    description: 'Execute tests with a single click and get detailed reports with actionable insights.',
                    icon: '🚀'
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    className="bg-dark-800/50 p-8 rounded-xl text-center relative z-10"
                  >
                    <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
                      {item.icon}
                    </div>
                    <div className="text-3xl font-bold text-primary-500 mb-2">{item.step}</div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-gray-300">{item.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-900/30">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-primary-500 font-semibold text-lg mb-2 block">TESTIMONIALS</span>
              <h2 className="text-4xl font-bold mb-4">Trusted by Leading Teams</h2>
              <p className="text-gray-300 max-w-2xl mx-auto text-lg">
                See what our customers say about their experience with OneTest X.
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
            >
              {[
                {
                  quote: "OneTest X has revolutionized our testing process. We've reduced our test execution time by 70%.",
                  author: "Sarah Johnson",
                  role: "QA Lead at TechCorp",
                  avatar: "👩‍💻"
                },
                {
                  quote: "The AI-powered test generation is a game changer. It cut our test creation time in half.",
                  author: "Michael Chen",
                  role: "Engineering Manager at InnovateSoft",
                  avatar: "👨‍💼"
                },
                {
                  quote: "Incredible platform with amazing support. Our team's productivity has never been higher.",
                  author: "Emily Rodriguez",
                  role: "CTO at DevStream",
                  avatar: "👩‍🔧"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card p-8"
                >
                  <div className="text-5xl mb-4">{testimonial.avatar}</div>
                  <p className="text-gray-300 italic mb-6">"{testimonial.quote}"</p>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-purple-500/5"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_0%,rgba(0,0,0,0)_50%)]"></div>
          </div>
          <div className="container mx-auto max-w-6xl relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ 
                opacity: 1, 
                y: 0,
                transition: { duration: 0.6 }
              }}
              viewport={{ once: true, margin: "-50px" }}
              className="glass-card p-8 sm:p-12 text-center relative overflow-hidden"
            >
              {/* Animated background elements */}
              <motion.div 
                className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl"
                animate={{
                  x: [0, 20, 0],
                  y: [0, 20, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div 
                className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"
                animate={{
                  x: [0, -15, 0],
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1
                }}
              />
              <h2 className="text-3xl font-bold mb-4">Ready to transform your testing workflow?</h2>
              <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                Get started with OneTest X today and experience the future of test automation.
              </p>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Link href="/login">
                  <Button size="lg" className="px-8 relative overflow-hidden group">
                    <span className="relative z-10">Start Testing Now</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-dark-800">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center text-gray-400 text-sm">
              <p>© {new Date().getFullYear()} OneOrigin. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
