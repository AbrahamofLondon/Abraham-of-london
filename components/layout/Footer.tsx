// components/layout/Footer.tsx
import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Abraham of London</h3>
            <p className="text-gray-600 mb-4">
              Premium investment insights and strategies for Inner Circle members.
            </p>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} All rights reserved.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/inner-circle/dashboard" className="text-gray-600 hover:text-blue-600">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/inner-circle/content" className="text-gray-600 hover:text-blue-600">
                  Content Library
                </Link>
              </li>
              <li>
                <Link href="/inner-circle/profile" className="text-gray-600 hover:text-blue-600">
                  Your Profile
                </Link>
              </li>
              <li>
                <Link href="/inner-circle/settings" className="text-gray-600 hover:text-blue-600">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-600 hover:text-blue-600">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-blue-600">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-blue-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-blue-600">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>Version 1.0.0 • Built with Next.js</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;