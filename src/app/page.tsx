import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Services } from "@/components/site/Services";
import { WhoWeAre } from "@/components/site/WhoWeAre";
import { CTABand } from "@/components/site/CTABand";
import { UseCases } from "@/components/site/UseCases";
import { Performance } from "@/components/site/Performance";
import { PlansTeaser } from "@/components/site/PlansTeaser";
import { ReferralTeaser } from "@/components/site/ReferralTeaser";
import { Resources } from "@/components/site/Resources";
import { Footer } from "@/components/site/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <WhoWeAre />
        <CTABand />
        <UseCases />
        <Performance />
        <PlansTeaser />
        <ReferralTeaser />
        <Resources />
      </main>
      <Footer />
    </>
  );
}
