"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BriefcaseIcon,
  LineChart,
  TrendingUp,
  TrendingDown,
  Brain,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const DashboardView = ({ insights }) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  useEffect(() => {
    // Check screen size on mount
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };
    
    // Set initial value
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Safety check for null or invalid insights
  if (!insights || typeof insights !== 'object') {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Unable to load industry insights</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // Ensure all required properties exist with fallbacks
  const safeInsights = {
    salaryRanges: Array.isArray(insights.salaryRanges) ? insights.salaryRanges : [],
    growthRate: typeof insights.growthRate === 'number' ? insights.growthRate : 0,
    demandLevel: insights.demandLevel || 'Unknown',
    topSkills: Array.isArray(insights.topSkills) ? insights.topSkills : [],
    marketOutlook: insights.marketOutlook || 'Unknown',
    keyTrends: Array.isArray(insights.keyTrends) ? insights.keyTrends : [],
    recommendedSkills: Array.isArray(insights.recommendedSkills) ? insights.recommendedSkills : [],
    lastUpdated: insights.lastUpdated || new Date(),
    nextUpdate: insights.nextUpdate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };

  // Transform salary data for the chart - with safety checks
  const salaryData = safeInsights.salaryRanges.map((range) => ({
    name: range.role || 'Unknown Role',
    min: typeof range.min === 'number' ? range.min / 1000 : 0,
    max: typeof range.max === 'number' ? range.max / 1000 : 0,
    median: typeof range.median === 'number' ? range.median / 1000 : 0,
  }));

  const getDemandLevelColor = (level) => {
    switch (String(level).toLowerCase()) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMarketOutlookInfo = (outlook) => {
    switch (String(outlook).toLowerCase()) {
      case "positive":
        return { icon: TrendingUp, color: "text-green-500" };
      case "neutral":
        return { icon: LineChart, color: "text-yellow-500" };
      case "negative":
        return { icon: TrendingDown, color: "text-red-500" };
      default:
        return { icon: LineChart, color: "text-gray-500" };
    }
  };

  const OutlookIcon = getMarketOutlookInfo(safeInsights.marketOutlook).icon;
  const outlookColor = getMarketOutlookInfo(safeInsights.marketOutlook).color;

  // Format dates using date-fns with safety checks
  let lastUpdatedDate, nextUpdateDistance;
  try {
    lastUpdatedDate = format(new Date(safeInsights.lastUpdated), "dd/MM/yyyy");
    nextUpdateDistance = formatDistanceToNow(
      new Date(safeInsights.nextUpdate),
      { addSuffix: true }
    );
  } catch (error) {
    lastUpdatedDate = "Unknown";
    nextUpdateDistance = "Unknown";
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Badge variant="outline">Last updated: {lastUpdatedDate}</Badge>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Market Outlook
            </CardTitle>
            <OutlookIcon className={`h-4 w-4 ${outlookColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeInsights.marketOutlook}</div>
            <p className="text-xs text-muted-foreground">
              Next update {nextUpdateDistance}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Industry Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeInsights.growthRate.toFixed(1)}%
            </div>
            <Progress value={safeInsights.growthRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demand Level</CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeInsights.demandLevel}</div>
            <div
              className={`h-2 w-full rounded-full mt-2 ${getDemandLevelColor(
                safeInsights.demandLevel
              )}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Skills</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {safeInsights.topSkills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Ranges Chart */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Salary Ranges by Role</CardTitle>
          <CardDescription>
            Displaying minimum, median, and maximum salaries (in thousands)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] sm:h-[350px] md:h-[400px]">
            {salaryData.length > 0 ? (
              <>
                <p className="text-xs text-muted-foreground text-center block sm:hidden mb-2">
                  <svg className="w-4 h-4 inline-block mr-1 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Rotate device for better view
                </p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={salaryData} 
                    barSize={isSmallScreen ? (salaryData.length > 3 ? 12 : 20) : undefined}
                    barGap={isSmallScreen ? (salaryData.length > 3 ? 1 : 3) : undefined}
                    barCategoryGap={isSmallScreen ? (salaryData.length > 3 ? "8%" : "15%") : undefined}
                    margin={isSmallScreen ? { top: 5, right: 5, left: 5, bottom: 20 } : undefined}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: isSmallScreen ? 10 : 12 }}
                      interval={isSmallScreen ? (salaryData.length > 4 ? 1 : 0) : 0}
                      height={isSmallScreen ? 60 : 50}
                      angle={isSmallScreen ? -45 : 0}
                      textAnchor={isSmallScreen ? "end" : "middle"}
                      tickFormatter={(value) => {
                        // For small screens, truncate role names if they're too long
                        return isSmallScreen && value.length > 8
                          ? `${value.substring(0, 8)}...`
                          : value;
                      }}
                    />
                    <YAxis tick={{ fontSize: isSmallScreen ? 10 : 12 }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg p-2 shadow-md">
                              <p className="font-medium">{label}</p>
                              {payload.map((item) => (
                                <p key={item.name} className="text-sm">
                                  {item.name}: ${item.value}K
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="min" fill="#94a3b8" name="Min Salary (K)" />
                    <Bar dataKey="median" fill="#64748b" name="Median Salary (K)" />
                    <Bar dataKey="max" fill="#475569" name="Max Salary (K)" />
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No salary data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Industry Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Key Industry Trends</CardTitle>
            <CardDescription>
              Current trends shaping the industry
            </CardDescription>
          </CardHeader>
          <CardContent>
            {safeInsights.keyTrends.length > 0 ? (
              <ul className="space-y-4">
                {safeInsights.keyTrends.map((trend, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                    <span>{trend}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No trends available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Skills</CardTitle>
            <CardDescription>Skills to consider developing</CardDescription>
          </CardHeader>
          <CardContent>
            {safeInsights.recommendedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {safeInsights.recommendedSkills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recommended skills available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;
