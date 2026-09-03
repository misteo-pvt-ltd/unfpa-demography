'use client';

import { motion } from 'framer-motion';
// import { StatCard } from './shared';

import bg from '../../assets/images/odisha-bg.svg';

export function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full overflow-hidden rounded-none"
    >
      {/* ---------- BACKGROUND ---------- */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${bg})` }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, #235E83 0%, rgba(35,94,131,0.95) 50%, rgba(35,94,131,0.75) 65%, rgba(249,96,0,0.65) 90%, rgba(249,96,0,0.55) 100%)',
          }}
        />
      </div>

      {/* ---------- CONTENT ---------- */}
      <div className="relative z-10 px-6 md:px-10 py-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        {/* Heading */}
        <h1 className="text-4xl md:text-4xl font-black tracking-tight leading-[1.1] max-w-4xl">
          Insights into Odisha’s{' '}
          <span className="text-white">
            <br /> Evolving Demographic Landscape
          </span>
        </h1>

        {/*  FLEX CONTAINER (TEXT + STATS SIDE BY SIDE) */}
        <div className="mt-6 flex flex-col lg:flex-row gap-15 items-start lg:items-center">
          {/* LEFT → TEXT */}
          <div className="max-w-full space-y-2 text-md md:text-[16px] font-medium leading-relaxed text-white flex-1">
            <p>
              Odisha stands at an important demographic juncture. Home to over
              41.97 million people as per the 2011 Census, up from 31.66 million
              in 1991, the state has moved through decades of improving
              healthcare, declining mortality, and gradual fertility decline.
              Growth has slowed across successive census periods, signalling a
              maturing demographic transition, even as the composition of
              Odisha's people, their age, location, and access to services,
              continues to evolve.
            </p>

            <p>
              {' '}
              Internal migration remains a defining feature of this shift.
              Movement from rural areas toward Bhubaneswar, Cuttack, Rourkela,
              and the growth corridors of Jharsuguda, Angul, and Kalinganagar
              reflects the state's expanding economic base. At the same time,
              several districts face out-migration, ageing populations, and
              changing household structures, each with distinct implications for
              planning and service delivery.{' '}
              Much of this complexity, however, remains fragmented across
              departments, surveys, and administrative records, with
              demographic, health, migration, and spatial datasets rarely
              speaking to one another. As Odisha prepares for the next decade of
              development planning, the absence of a unified, spatially
              intelligent view of its population has become a binding constraint
              on evidence-based decision-making.
            </p>

            <p>
              The Odisha Demographic and Data Intelligence Platform has been
              conceived to address this gap. By integrating census, survey,
              administrative, and geospatial data within a single analytical
              environment, it enables decision-makers to move from static
              reporting to dynamic, district and block-level intelligence,
              supporting more precise targeting of interventions and stronger
              alignment between population dynamics and Odisha's long-term
              development vision.
            </p>

            {/* <p>
              The demographic landscape of Odisha is also shaped by its rich
              ethnic and tribal diversity, with Scheduled Tribes comprising
              nearly 22.8% of the total population — one of the highest
              proportions among Indian states. Improvements in literacy,
              particularly female literacy, alongside declining fertility rates
              and better maternal health outcomes, are reshaping the state's age
              structure, creating a growing youth population that holds immense
              potential as a demographic dividend. These changes present both
              opportunities and challenges for policymakers as they navigate
              infrastructure development, employment generation, and equitable
              social welfare across Odisha's diverse urban and rural
              communities.
            </p> */}
          </div>

          {/* RIGHT → STAT CARDS */}
          {/* <div className="grid grid-cols-2 gap-6 w-full max-w-md pl-10">
            <StatCard
              label="Districts"
              value="30"
              sub="Spatially geocoded"
              transparent
            />
            <StatCard
              label="Horizon"
              value="2036"
              sub="Projected timeline"
              transparent
            />
            <StatCard
              label="Target MAPE"
              value="< 5%"
              sub="Model accuracy"
              transparent
            />
            <StatCard
              label="Fusion Layers"
              value="6+"
              sub="Satellite + Admin"
              transparent
            />
          </div> */}
        </div>
      </div>
    </motion.div>
  );
}
