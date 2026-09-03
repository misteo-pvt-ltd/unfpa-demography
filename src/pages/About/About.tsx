import React from 'react';
import PageWrapper from '../PageWrapper/PageWrapper';
import pipelineImage from '../../assets/images/pipeline.png';
import WhoCan from '../../assets/images/whocan.png';

const AboutPage: React.FC = () => {
  return (
    <PageWrapper title="About the Project">
      <div className="w-full pb-12 pt-0 px-6">
        <div className="space-y-10">
          {/* Main Content Section */}
          <div className="space-y-8">
            <p className="text-xl md:text-2xl text-gray-800 leading-relaxed font-medium border-l-4 border-[#F96000] pl-8 py-2">
              The Odisha Demographic and Data Intelligence Platform is an open-source web initiative by UNFPA India, built to modernize how demographic trends are understood, analyzed, and acted upon across Odisha.
            </p>

            <div className="grid grid-cols-1 gap-10 text-gray-600 text-lg leading-relaxed font-light">
              <p className="font-normal">
                Census data is authoritative but arrives only once a decade, a cadence too slow for the socio-economic shifts reshaping communities today. The platform closes that gap by fusing historical census records with satellite imagery and machine learning, producing a dynamic, near real-time picture of population change to support more responsive governance and planning.
              </p>

              <p className="font-normal">
                The platform converts complex geospatial and demographic data into clear, interactive visualizations. Machine learning models read satellite imagery against official population records to surface the relationships between physical landscape change and human settlement, revealing where people live, how communities are growing or shrinking, and where resources can be distributed more equitably. The result is a decision-support tool that turns raw data into actionable intelligence for policymakers, planners, researchers, and the public.
              </p>

              <p className="font-normal">
                The initiative runs on six interconnected stages: data acquisition and preprocessing, correlation evaluation, geospatial analysis, predictive modeling, visualization and interpretation, and integration into a user-friendly web interface. Each stage builds on the last, moving from cloud-free imagery and census collection through pattern recognition and spatial analysis to forecasts that project trends forward. Districts are classified as fast-growing, stable, or declining, helping prioritize where infrastructure and social programs are needed most.
              </p>

              <p className="font-normal pt-4">
                In line with UNFPA's mission to harness population data for sustainable development, the platform gives Odisha a forward-looking planning tool, one that moves beyond static spreadsheets toward dynamic, AI-driven models of demographic health. Through an intuitive dashboard with interactive maps, custom filters, and a curated research library, it puts data-driven insight directly in the hands of decision-makers and citizens, supporting smarter strategic planning, stronger infrastructure, and more effective social programs statewide.

              </p>
            </div>
            <div className="grid grid-cols-1 gap-10 text-gray-600 text-lg leading-relaxed font-light">
              <h4 className="font-bold">
                How it works
              </h4>

              <p className="font-normal">
                The platform turns raw satellite imagery and census records into district-level forecasts through six connected stages
              </p>

              <div className="my-6 flex flex-col items-center">
                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white p-4 max-w-3xl">
                  <img
                    src={pipelineImage}
                    alt="Odisha Demographic Platform data pipeline"
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>
                <span className="text-xs text-gray-500 mt-3 font-medium tracking-wide text-center">
                  The six-stage data pipeline, from acquisition to district classification.
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-10 text-gray-600 text-lg leading-relaxed font-light">
              <h4 className="font-bold">
                Who can use this
              </h4>

              <p className="font-normal">
                The platform is built to serve two audiences at once. Administrators, planners, and policymakers use it as a decision-support engine: identifying which districts are growing or contracting, where health and education infrastructure is falling behind population, and how to direct resources before a crisis becomes visible in the next census. The general public, researchers, students, and civil society use it as an open window into how their communities are changing, with maps, filters, and a research library that make demographic intelligence transparent and accessible to everyone, not just the officials who hold the spreadsheets.
              </p>

              <div className="my-6 flex flex-col items-center">
                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white p-4 max-w-3xl">
                  <img
                    src={WhoCan}
                    alt="Odisha Demographic Platform data pipeline"
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>
                <span className="text-xs text-gray-500 mt-3 font-medium tracking-wide text-center">
                  One shared engine, two audiences, two kinds of impact.
                </span>
              </div>
              <h4 className="font-bold">
                Why it matters
              </h4>
              <p className="text-xl md:text-2xl text-gray-800 leading-relaxed font-medium border-l-4 border-[#F96000] pl-8 py-2">
                Behind every data point on this platform is a person, a household, a community waiting to be counted. By the time a once-a-decade census tells us a region is ageing, shrinking, or straining its resources, the moment to act has often already passed. This platform exists to close that gap between knowing and doing, so that no community in Odisha is governed by a ten-year-old snapshot, and so that the future can be planned for while there is still time to shape it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AboutPage;
