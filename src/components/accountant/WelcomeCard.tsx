import React from 'react';

interface WelcomeCardProps {
  paymentsCount: number;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ paymentsCount }) => {
  return (
    <div className="bg-blue-600 text-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-2">
        Welcome back, Accountant!
      </h2>
      <p className="text-blue-100">
        Here's your financial overview for today. You have {paymentsCount} payments processed today.
      </p>
    </div>
  );
};

export default WelcomeCard;