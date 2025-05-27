"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Button } from '@/components/ui/Button';
import { Mail, Phone, MapPin, Send, Check, X } from 'lucide-react';
import Link from 'next/link';

type FormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, we'll randomly succeed or fail
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error('Failed to send message. Please try again later.');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const contactMethods = [
    {
      icon: <Mail className="h-6 w-6 text-cyan-400" />,
      title: 'Email',
      text: 'support@onetestx.com',
      link: 'mailto:support@onetestx.com',
    },
    {
      icon: <Phone className="h-6 w-6 text-purple-400" />,
      title: 'Phone',
      text: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
    },
    {
      icon: <MapPin className="h-6 w-6 text-green-400" />,
      title: 'Office',
      text: '123 Test Street, San Francisco, CA 94103',
      link: 'https://maps.google.com',
    },
  ];

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
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-dark-800 text-cyan-400 mb-6 border border-cyan-500/20">
                <Send className="mr-2 h-4 w-4" /> Contact Us
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Get in Touch
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-400">
                Have questions or feedback? We'd love to hear from you.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="py-16 bg-dark-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
                  <p className="text-gray-400">
                    Fill out the form or reach out through one of these methods and we'll get back to you as soon as possible.
                  </p>
                </div>

                <div className="space-y-6">
                  {contactMethods.map((method, index) => (
                    <a
                      key={index}
                      href={method.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start space-x-4 p-4 rounded-xl bg-dark-800/50 border border-dark-700 hover:border-cyan-500/30 transition-colors duration-200"
                    >
                      <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-dark-700 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                        {method.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-400">{method.title}</h3>
                        <p className="mt-1 text-white">{method.text}</p>
                      </div>
                    </a>
                  ))}
                </div>

                <div className="pt-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Follow us</h3>
                  <div className="flex space-x-4">
                    {['github', 'twitter', 'linkedin', 'discord'].map((social) => (
                      <a
                        key={social}
                        href="#"
                        className="h-10 w-10 rounded-full bg-dark-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-600 transition-colors"
                        aria-label={social}
                      >
                        <span className="sr-only">{social}</span>
                        <div className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="bg-dark-800/50 rounded-2xl p-8 border border-dark-700">
                  <h2 className="text-2xl font-bold text-white mb-2">Send us a message</h2>
                  <p className="text-gray-400 mb-8">We'll get back to you as soon as possible.</p>
                  
                  {status === 'success' && (
                    <div className="mb-6 p-4 rounded-lg bg-green-900/30 border border-green-800 text-green-400 flex items-start">
                      <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Message sent successfully!</p>
                        <p className="text-sm mt-1">We'll get back to you soon.</p>
                      </div>
                    </div>
                  )}
                  
                  {status === 'error' && error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-400 flex items-start">
                      <X className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Error sending message</p>
                        <p className="text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                        Full name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="block w-full px-4 py-3 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                        Email address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="block w-full px-4 py-3 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="you@example.com"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-400 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="block w-full px-4 py-3 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="How can we help you?"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-1">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="block w-full px-4 py-3 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="Your message here..."
                      />
                    </div>
                    
                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={status === 'submitting'}
                      >
                        {status === 'submitting' ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-dark-800 to-dark-900">
          <div className="absolute inset-0 bg-grid-white/[0.03]" />
          <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                Join thousands of developers already using OneTest X to build better software.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 transition-all duration-200"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-700 text-base font-medium rounded-lg text-white bg-dark-800/50 hover:bg-dark-700/80 hover:border-cyan-500/30 transition-all duration-200"
                >
                  Request Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
