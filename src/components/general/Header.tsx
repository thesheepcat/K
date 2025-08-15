//import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
    return(
        <div></div>
    /*
        <div className="sticky top-0 bg-background border-b border-light">
          <div className="p-4 pb-0">
            <div className="flex border-b border-light">
              <Button
                variant="ghost"
                className={`px-6 py-3 text-base font-semibold rounded-none border-b-2 hover:bg-muted ${
                  activeTab === 'home' 
                    ? 'border-active text-active' 
                    : 'border-transparent text-secondary-action hover:text-secondary-action-hover'
                }`}
                onClick={() => setActiveTab('home')}
              >
                Home
              </Button>
              <Button
                variant="ghost"
                className={`px-6 py-3 text-base font-semibold rounded-none border-b-2 hover:bg-muted ${
                  activeTab === 'my-posts' 
                    ? 'border-active text-active' 
                    : 'border-transparent text-secondary-action hover:text-secondary-action-hover'
                }`}
                onClick={() => setActiveTab('my-posts')}
              >
                My posts
              </Button>
              <Button
                variant="ghost"
                className={`px-6 py-3 text-base font-semibold rounded-none border-b-2 hover:bg-muted ${
                  activeTab === 'following' 
                    ? 'border-active text-active' 
                    : 'border-transparent text-secondary-action hover:text-secondary-action-hover'
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