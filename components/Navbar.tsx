import Link from "next/link";
import { getUser, UserWithProfileAndCredits } from "../lib/auth"; // Import UserWithProfileAndCredits
import LogoutButton from "./LogoutButton";

const Navbar = async () => {
  const user: UserWithProfileAndCredits | null = await getUser(); // Use the explicit type

  const isAstrologer = user?.profile?.role === 'astrologer';
  const isAdmin = user?.profile?.role === 'admin';
  const isUser = user?.profile?.role === 'user';

  let astrologerAccessMessage = '';
  if (isAstrologer && user?.profile) {
    const now = new Date();
    const validFrom = user.profile.valid_from ? new Date(user.profile.valid_from) : null;
    const validTo = user.profile.valid_to ? new Date(user.profile.valid_to) : null;

    if (validFrom && validTo && now >= validFrom && now <= validTo) {
      astrologerAccessMessage = `Valid till ${validTo.toLocaleDateString()} (Unlimited)`;
    } else {
      astrologerAccessMessage = 'Astrologer access expired';
    }
  }

  return (
    <nav className="relative z-20 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Vastu AI
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/"
                className="text-gray-700 hover:bg-gray-200 hover:text-black px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              {user && (
                <Link
                  href="/projects"
                  className="text-gray-700 hover:bg-gray-200 hover:text-black px-3 py-2 rounded-md text-sm font-medium"
                >
                  Projects
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-gray-700 hover:bg-gray-200 hover:text-black px-3 py-2 rounded-md text-sm font-medium"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? ( // Use 'user' directly now
                <>
                  <span className="text-gray-700 text-sm mr-4">
                    {user.email}
                  </span>
                  {isUser && user.profile?.credits !== undefined && (
                    <span className="text-gray-700 text-sm mr-4">
                      Credits: {user.profile.credits}
                    </span>
                  )}
                  {isAstrologer && (
                    <span className={`text-sm mr-4 ${astrologerAccessMessage.includes('expired') ? 'text-red-500' : 'text-green-700'}`}>
                      {astrologerAccessMessage}
                    </span>
                  )}
                  <LogoutButton />
                </>
              ) : (
                <div className="space-x-4">
                  <Link
                    href="/login"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            {/* Mobile menu button */}
            <button
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon for menu */}
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-4 6h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
