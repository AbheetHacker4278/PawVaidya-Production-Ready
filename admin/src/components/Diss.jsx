import React from 'react';

const Diss = () => {
  // hello
  return (
    <div className="w-full h-screen max-w-full overflow-hidden">
      <iframe
        src="https://diss-umber.vercel.app/"
        className="w-full h-full"
        style={{ border: 'none' }}
        title="Discussion Forum"
      />
    </div>
  );
};

export default Diss;