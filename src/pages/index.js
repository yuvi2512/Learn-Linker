import React,{lazy,Suspense} from "react";

const LazyHomePage = lazy(() => import('@/pages/Components/Home'));

const Home = () => {
  return (
    <>
    <Suspense fallback={<div>Loading...</div>}>
      <LazyHomePage />
    </Suspense>
    </>
  );
};

export default Home;
