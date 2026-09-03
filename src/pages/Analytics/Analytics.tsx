import React from 'react';
import PageWrapper from '../PageWrapper/PageWrapper';

const AnalyticsPage: React.FC = () => {
  return (
    <PageWrapper title="Analytics">
      <div className="w-full">
        <div className="space-y-8">
          <div className="mb-8">
            <p className="text-gray-500 text-sm">Research publications and demographic insights from DIU studies</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Population Dynamics in Eastern Odisha',
                date: 'Nov 2024',
                desc: 'Analysis of demographic shifts in coastal districts with focus on migration patterns and urbanization trends.',
                tags: ['Migration', 'Urbanization']
              },
              {
                title: 'Building Footprint Expansion Analysis',
                date: 'Oct 2024',
                desc: 'Satellite-based assessment of construction growth across 30 districts using Google Earth Engine algorithms.',
                tags: ['Remote Sensing', 'GEE']
              },
              {
                title: 'Infrastructure-Population Correlation Study',
                date: 'Sep 2024',
                desc: 'Statistical analysis of road network expansion and its impact on population distribution and growth rates.',
                tags: ['Infrastructure', 'Statistics']
              },
              {
                title: 'Urban-Rural Classification Framework',
                date: 'Aug 2024',
                desc: 'Development of multi-criteria classification system for settlement categorization using ML algorithms.',
                tags: ['Machine Learning', 'Classification']
              },
              {
                title: 'Nighttime Lights as Development Proxy',
                date: 'Jul 2024',
                desc: 'Using VIIRS nighttime light data to estimate economic activity and electrification progress.',
                tags: ['VIIRS', 'Economy']
              },
              {
                title: 'Gender-Disaggregated Demographic Analysis',
                date: 'Jun 2024',
                desc: 'Deep dive into sex ratio variations across districts with policy recommendations.',
                tags: ['Gender', 'Policy']
              }
            ].map((item, index) => (
              <div key={index} className="bg-[#F9FAFB] rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col h-full">
                {/* Card Header */}
                <div className="bg-[#FFF4EB] p-6 relative overflow-hidden">
                  {/* Abstract Pattern overlay */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <h3 className="text-lg font-bold text-[#D66B12] mb-2 leading-snug relative z-10">{item.title}</h3>
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {item.date}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex flex-col flex-grow">
                  <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-grow">
                    {item.desc}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {item.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-white text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-gray-100 shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AnalyticsPage;
