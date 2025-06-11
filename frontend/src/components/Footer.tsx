import React from 'react';

const Footer: React.FC = () => {
  const handleHelpSupport = () => {
    const subject = encodeURIComponent('Website Issue');
    const mailtoLink = `mailto:aaravkohli111@gmail.com?subject=${subject}`;
    window.location.href = mailtoLink;
  };

  return (
    <footer className="bg-neutral-dark text-white py-12 mt-auto">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quiz Platform</h3>
            <p className="text-sm text-gray-300">
              A modern platform for creating and taking quizzes, designed for both students and instructors.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-sm text-gray-300 hover:text-white transition-colors duration-200">
                  Home
                </a>
              </li>
              <li>
                <a href="/profile" className="text-sm text-gray-300 hover:text-white transition-colors duration-200">
                  Profile
                </a>
              </li>
              <li>
                <a href="/create-quiz" className="text-sm text-gray-300 hover:text-white transition-colors duration-200">
                  Create Quiz
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Support</h3>
            <p className="text-sm text-gray-300">
              Need help? We're here to assist you.
            </p>
            <button
              onClick={handleHelpSupport}
              className="inline-flex items-center px-4 py-2 bg-accent-color hover:bg-secondary-color text-white rounded-md transition-colors duration-200 hover-scale"
            >
              <span className="mr-2">Help & Support</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-300">
              © {new Date().getFullYear()} Aarav Kohli. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="/" className="text-gray-300 hover:text-white">
                Home
              </a>
              <a href="/about" className="text-gray-300 hover:text-white">
                About
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 