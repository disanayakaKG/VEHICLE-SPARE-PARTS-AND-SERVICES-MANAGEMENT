import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-dark-900/80 backdrop-blur-xl border-t border-dark-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl">
          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-gray-400 text-sm">
                <FiMapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary-400" />
                <span>232 Malabe</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400 text-sm">
                <FiPhone className="w-4 h-4 flex-shrink-0 text-primary-400" />
                <span>0729731082</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400 text-sm">
                <FiMail className="w-4 h-4 flex-shrink-0 text-primary-400" />
                <span>Premiurpartsupplier@gail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-700/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} AutoParts Pro. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
