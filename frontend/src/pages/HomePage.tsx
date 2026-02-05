import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="px-4 py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Ласкаво просимо до Fans CRM
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Система управління користувачами
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to="/users"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-lg hover:bg-indigo-700 transition-colors"
          >
            Перейти до користувачів
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Управління користувачами
          </h3>
          <p className="text-gray-600">
            Додавайте та переглядайте інформацію про користувачів
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Пошук та фільтрація
          </h3>
          <p className="text-gray-600">
            Швидкий пошук користувачів за ім'ям, email або телефоном
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Пагінація
          </h3>
          <p className="text-gray-600">
            Ефективна робота з великою кількістю даних
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default HomePage;
