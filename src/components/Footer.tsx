import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-600 text-sm mb-4 md:mb-0">
            © 2025 Grocery Share. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <Link
              to="/terms"
              className="text-gray-600 hover:text-green-600 text-sm transition"
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="text-gray-600 hover:text-green-600 text-sm transition"
            >
              Privacy
            </Link>
            <Link
              to="/contact"
              className="flex items-center space-x-1 text-gray-600 hover:text-green-600 text-sm transition"
            >
              <Mail className="h-4 w-4" />
              <span>Contact Us</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
