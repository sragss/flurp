import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import TestPage2 from "./TestPage2";
import TestPage3 from "./TestPage3";
import TestPage4 from "./TestPage4";
import TestPage5 from "./TestPage5";
import TestPage6 from "./TestPage6";
import TestPage7 from "./TestPage7";
import TestPage8 from "./TestPage8";
import TestPage9 from "./TestPage9";
import TestPage10 from "./TestPage10";
import TestPage11 from "./TestPage11";

function TestPage1() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to Test Page 1</h1>
        <p className="text-gray-600 mb-4">
          This is a simple, clean test page demonstrating basic React components and styling.
        </p>
        <Link 
          to="/"
          className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <main className="min-h-screen p-0">
        <Routes>
          <Route path="/" element={
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold text-white text-center uppercase py-8">Fluuurp</h1>
              <div className="bg-white rounded-t-lg shadow-lg p-6 h-screen">
                <h2 className="text-2xl font-bold text-center uppercase mb-4">Page Directory</h2>
                <ul className="space-y-3 uppercase text-center">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Link to="/" className="hover:text-blue-700">Home - Main directory page</Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Link to="/test1" className="hover:text-blue-700">Test Page 1 - First test page</Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Link to="/test2" className="hover:text-blue-700">Test Page 2 - Second test page</Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Link to="/test3" className="hover:text-blue-700">Test Page 3 - Third test page</Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Link to="/test4" className="hover:text-blue-700">Test Page 4 - Fourth test page</Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Link to="/test5" className="hover:text-blue-700">Test Page 5 - Fifth test page</Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Link to="/test6" className="hover:text-blue-700">Test Page 6 - Sixth test page</Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Link to="/test7" className="hover:text-blue-700">Test Page 7 - Seventh test page</Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Link to="/test8" className="hover:text-blue-700">Test Page 8 - Eighth test page</Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Link to="/test9" className="hover:text-blue-700">Test Page 9 - Ninth test page</Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Link to="/test10" className="hover:text-blue-700">Test Page 10 - Tenth test page</Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Link to="/test11" className="hover:text-blue-700">Test Page 11 - Eleventh test page</Link>
                  </li>
                </ul>
              </div>
            </div>
          } />
          <Route path="/test1" element={<TestPage1 />} />
          <Route path="/test2" element={<TestPage2 />} />
          <Route path="/test3" element={<TestPage3 />} />
          <Route path="/test4" element={<TestPage4 />} />
          <Route path="/test5" element={<TestPage5 />} />
          <Route path="/test6" element={<TestPage6 />} />
          <Route path="/test7" element={<TestPage7 />} />
          <Route path="/test8" element={<TestPage8 />} />
          <Route path="/test9" element={<TestPage9 />} />
          <Route path="/test10" element={<TestPage10 />} />
          <Route path="/test11" element={<TestPage11 />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
