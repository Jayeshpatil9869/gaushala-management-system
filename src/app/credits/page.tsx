import React from "react";

const GithubIcon = () => (
  <svg className="w-5 h-5 fill-[#3b5998]" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const CreditsPage = () => {
  const teamMembers = [
    {
      name: "Mahendra Nagpure",
      role: "Full Stack Developer",
      github: "https://github.com/Mahendra111111",
    },
    {
      name: "Jayesh Patil",
      role: "Full Stack Developer",
      github: "https://github.com/Jayeshpatil9869/",
    },
  ];

  return (
    <>
      <div className="min-h-screen flex flex-col">
        {/* <div className="h-20"></div> */}
        <div className="flex-1 flex justify-center items-center p-3 sm:p-5  inset-0 bg-gradient-to-br from-primary/10 via-primary/60 to-secondary/10 font-sans">
          <div className="bg-white border-2 sm:border-3 border-[#3b5998] rounded-[15px] sm:rounded-[20px] p-4 sm:p-8 md:p-10 max-w-[800px] w-full mt-[10vh]">
            {/* Back Button */}
            <div className="absolute top-4 left-4">
              <a
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-whitebg-gradient-to-br from-[#8b9dc3] to-[#dfe3ee] "
              >
                &larr; Back to Home
              </a>
            </div>
            {/* Logo Section */}
            <div className="text-center mb-6 sm:mb-10 pb-6">
              <div className="w-[120px] h-[120px] border-3 border-[#3b5998] rounded-full mx-auto mb-5 flex items-center justify-center bg-gradient-to-br from-[#8b9dc3] to-[#dfe3ee] overflow-hidden">
                <img
                  src="/DigiMirai.png"
                  alt="DigiMirai_Logo"
                  className="w-[25vh]"
                />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#3b5998] tracking-[2px] uppercase">
                DigiMirai
              </div>
            </div>

            {/* Project Overview Section */}
            <div className="text-xl sm:text-2xl font-bold text-[#3b5998] mb-3 sm:mb-5 uppercase tracking-wider">
              Project Overview
            </div>
            <div className="bg-[#f7f7f7] p-4 sm:p-6 rounded-lg border-l-4 sm:border-l-5 border-l-[#3b5998] mb-6 sm:mb-8">
              <p className="text-[#3b5998] leading-[1.8] text-sm sm:text-base text-justify">
                The Gaushala Cow Management System is a web-based application
                designed to help cow shelters manage the health, registrations,
                and care of cows. The system aims to improve the overall
                well-being of the cows, streamline shelter operations, and
                provide valuable insights for data-driven decision-making. The
                system allows users to register new cows, track their health
                status, and manage their feeding schedules. When a new cow is
                brought to the shelter, the administrator creates a new cow
                profile, including details such as breed, age, and health
                status.
                <br />
                The system assigns a unique identification number to the cow,
                making it easy to track its health and care activities. By using
                the Gaushala Cow Management System, cow shelters can improve the
                health and well-being of their cows, streamline their
                operations, and make data-driven decisions. The system's
                features and benefits include improved cow health and
                well-being, streamlined shelter operations, and enhanced
                decision-making through data analysis.
              </p>
            </div>

            {/* Team Members Section */}
            <div className="text-xl sm:text-2xl font-bold text-[#3b5998] mb-3 sm:mb-5 uppercase tracking-wider">
              Team Members
            </div>
            <div className="flex justify-between items-center px-3 sm:px-5 mb-2 sm:mb-3 font-bold text-[#3b5998] text-base sm:text-lg">
              <span>Name</span>
              <span>Roles</span>
            </div>
            <hr className="border border-[#3b5998] opacity-20 mb-6 sm:mb-8" />

            <div className="mt-6 sm:mt-8">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-5 mb-3 bg-white rounded-lg shadow-sm"
                >
                  <div className="flex items-center flex-1 mb-2 sm:mb-0 w-full sm:w-auto">
                    <span className="text-base sm:text-lg font-bold text-[#3b5998] mr-3 sm:mr-4 capitalize">
                      {member.name}
                    </span>
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 hover:opacity-80 transition-opacity"
                    >
                      <GithubIcon />
                    </a>
                  </div>
                  <div className="text-[#3b5998] font-semibold text-sm sm:text-base text-left sm:text-right w-full sm:w-auto sm:flex-shrink-0 sm:ml-5">
                    {member.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreditsPage;
