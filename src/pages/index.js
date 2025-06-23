import React,{lazy,Suspense} from "react";

// export async function getStaticProps() {
//   const time = new Date().toLocaleTimeString();

//   return {
//     props: {
//       time,
//     },
//   };
// }

// export async function getServerSideProps() {
//   const time = new Date().toLocaleTimeString();

//   return {
//     props: {
//       time, 
//     },
//   };
// }

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
