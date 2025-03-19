'use client';
import InterestedOwners from '../components/InterestedOwners';

const InterestedOwnersPage = () => {
  return (
    <section className="bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Interested Property Owners</h1>
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-600 mb-6">
            Below is a list of property owners who have read your inquiries and are interested in connecting with you. 
            Their contact information is available for you to reach out directly.
          </p>
          <InterestedOwners />
        </div>
      </div>
    </section>
  );
};

export default InterestedOwnersPage; 