//import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
    return(
        <div></div>
    /*
        <div className="sticky top-0 bg-white border-b border-gray-200">
          <div className="p-4 pb-0">
            <div className="flex border-b border-gray-200">
              <Button
                variant="ghost"
                className={`px-6 py-3 text-base font-semibold rounded-none border-b-2 hover:bg-gray-100 ${
                  activeTab === 'home' 
                    ? 'border-black text-black' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('home')}
              >
                Home
              </Button>
              <Button
                variant="ghost"
                className={`px-6 py-3 text-base font-semibold rounded-none border-b-2 hover:bg-gray-100 ${
                  activeTab === 'my-posts' 
                    ? 'border-black text-black' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('my-posts')}
              >
                My posts
              </Button>
              <Button
                variant="ghost"
                className={`px-6 py-3 text-base font-semibold rounded-none border-b-2 hover:bg-gray-100 ${
                  activeTab === 'following' 
                    ? 'border-black text-black' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('following')}
              >
                Following
              </Button>
            </div>
          </div>
        </div>
        */
    );
}

export default Header;