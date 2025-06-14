import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div className="p-8 bg-blue-500 text-white">
      <h1 className="text-4xl font-bold mb-4">React Dashboard is Working!</h1>
      <p className="text-xl">If you can see this, React and Tailwind CSS are working correctly.</p>
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-blue-600 p-4 rounded">
          <h2 className="text-lg font-semibold">Card 1</h2>
          <p>This is a test card</p>
        </div>
        <div className="bg-blue-600 p-4 rounded">
          <h2 className="text-lg font-semibold">Card 2</h2>
          <p>Another test card</p>
        </div>
        <div className="bg-blue-600 p-4 rounded">
          <h2 className="text-lg font-semibold">Card 3</h2>
          <p>Third test card</p>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;