import Hero from '@/components/sections/Hero';
import Stats from '@/components/sections/Stats';
import Services from '@/components/sections/Services';
import Projects from '@/components/sections/Projects';
import About from '@/components/sections/About';
import Testimonials from '@/components/sections/Testimonials';
import Founders from '@/components/sections/Founders';
import Cta from '@/components/sections/Cta';

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Services />
      <Projects />
      <About />
      <Testimonials />
      <Founders />
      <Cta />
    </>
  );
}
