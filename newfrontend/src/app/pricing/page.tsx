"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Button } from '@/components/ui/Button';
import { Check, Zap, Shield, Clock, Code, GitBranch, Users, Server, Lock, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const pricingPlans = [
  {
    name: 'Starter',
    price: { monthly: 0, annually: 0 },
    description: 'Perfect for individual developers and small projects',
    features: [
      '100 test runs/month',
      '1 concurrent test run',
      'Basic test reporting',
      'Community support',
      'Public repositories only',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Team',
    price: { monthly: 25, annually: 20 },
    description: 'For growing teams that need more power',
    features: [
      '5,000 test runs/month',
      '5 concurrent test runs',
      'Advanced test reporting',
      'Priority support',
      'Private repositories',
      'Team dashboards',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: { monthly: 99, annually: 79 },
    description: 'For organizations with advanced needs',
    features: [
      'Unlimited test runs',
      '20+ concurrent test runs',
      'Advanced analytics',
      '24/7 priority support',
      'SLA & custom agreements',
      'On-premise options',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const includedFeatures = [
  { name: 'Unlimited projects', icon: Code },
  { name: 'GitHub, GitLab, Bitbucket', icon: GitBranch },
  { name: 'Team members', icon: Users },
  { name: 'Self-hosted runners', icon: Server },
  { name: 'SAML SSO', icon: Lock },
  { name: '24/7 Support', icon: HelpCircle },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [isYearly, setIsYearly] = useState(false);

  const toggleBilling = () => {
    setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly');
    setIsYearly(!isYearly);
  };

  return (
    <MainLayout>
      <NewNavbar />
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-dark-900 to-dark-800 pt-24 pb-16">
          <div className="absolute inset-0 bg-grid-white/[0.03]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Simple, Transparent Pricing
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-400">
                Choose the perfect plan for your team's needs. Start for free, upgrade anytime.
              </p>
              
              {/* Billing Toggle */}
              <div className="mt-10 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-400">Monthly</span>
                <button
                  type="button"
                  onClick={toggleBilling}
                  className={`mx-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
                    isYearly ? 'bg-cyan-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`${
                      isYearly ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-400">Annually</span>
                  <span className="ml-2 rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-400">
                    Save 20%
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="py-16 md:py-24 bg-dark-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-3 lg:gap-8">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`relative rounded-2xl border ${
                    plan.popular
                      ? 'border-cyan-500/30 bg-gradient-to-b from-cyan-500/5 to-transparent shadow-2xl shadow-cyan-500/10'
                      : 'border-dark-700 bg-dark-800/50'
                  } p-8`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                      <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-4 py-1 text-xs font-medium text-cyan-400 ring-1 ring-inset ring-cyan-500/20">
                        Most popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold leading-8 text-white">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-white">
                      ${plan.price[billingCycle]}
                    </span>
                    <span className="ml-1 text-sm font-medium text-gray-400">
                      {billingCycle === 'monthly' ? '/month' : '/year'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">{plan.description}</p>
                  <ul role="list" className="mt-8 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="h-5 w-5 flex-shrink-0 text-cyan-500" aria-hidden="true" />
                        <span className="ml-3 text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.name === 'Enterprise' ? '/contact' : '/signup'}
                    className={`mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-cyan-600 to-primary-600 text-white shadow-sm hover:from-cyan-500 hover:to-primary-500 focus-visible:outline-cyan-600'
                        : 'bg-dark-700 text-white hover:bg-dark-600 focus-visible:outline-white'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="bg-dark-900 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 sm:text-4xl">
                All plans include
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                Everything you need to build and test with confidence
              </p>
            </div>
            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 text-sm text-gray-400 sm:grid-cols-2 lg:grid-cols-3">
                {includedFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                      <feature.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-white">{feature.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-dark-800/50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl divide-y divide-gray-700">
              <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 text-center sm:text-4xl">
                Frequently asked questions
              </h2>
              <dl className="mt-10 space-y-6 divide-y divide-gray-700">
                {[
                  {
                    question: 'Can I change plans or cancel my subscription at any time?',
                    answer:
                      'Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes will take effect at the end of your current billing cycle.',
                  },
                  {
                    question: 'Do you offer discounts for non-profits or educational institutions?',
                    answer:
                      'Yes, we offer special pricing for non-profits and educational institutions. Please contact our sales team for more information.',
                  },
                  {
                    question: 'What payment methods do you accept?',
                    answer:
                      'We accept all major credit cards, including Visa, Mastercard, and American Express. We also support payments through PayPal and bank transfers for annual plans.',
                  },
                  {
                    question: 'Is there a free trial available?',
                    answer:
                      'Yes, you can try any paid plan free for 14 days. No credit card is required to start your free trial.',
                  },
                ].map((faq, index) => (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="pt-6"
                  >
                    <dt className="text-lg font-semibold text-white">{faq.question}</dt>
                    <dd className="mt-2 text-base text-gray-400">{faq.answer}</dd>
                  </motion.div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-dark-800 to-dark-900">
          <div className="absolute inset-0 bg-grid-white/[0.03]" />
          <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:w-2/3"
            >
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                <span className="block">Ready to get started?</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-primary-400">
                  Try OneTest X free for 14 days.
                </span>
              </h2>
              <p className="mt-4 text-lg text-gray-300">
                No credit card required. Cancel anytime.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 lg:mt-0 lg:flex-shrink-0"
            >
              <Link 
                href="/signup" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 transition-all duration-200 md:py-3.5 md:text-lg md:px-8"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-700 text-base font-medium rounded-lg text-white bg-dark-800/50 hover:bg-dark-700/80 hover:border-cyan-500/30 transition-all duration-200 md:py-3.5 md:text-lg md:px-8"
              >
                Contact Sales
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
