import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import _ from 'lodash';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Slider } from './components/ui/slider';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { AlertCircle, ShieldAlert, Percent, DollarSign, Filter } from 'lucide-react';

const FraudRiskDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoreThreshold, setScoreThreshold] = useState(600);
  const [amountThreshold, setAmountThreshold] = useState(50);
  const [blockedPercentage, setBlockedPercentage] = useState(0);
  const [blockedTransactions, setBlockedTransactions] = useState(0);
  const [caughtFraud, setCaughtFraud] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalFraud, setTotalFraud] = useState(0);
  const [view, setView] = useState('heatmap');
  const [operator, setOperator] = useState('OR'); // 'AND' or 'OR'
  
  // Min and max values for sliders
  const minScore = 1;
  const maxScore = 999;
  const minAmount = 0.01;
  const maxAmount = 1000; // Capping at 1000 for better usability, actual max is much higher

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Attempting to fetch original CSV data...');
        
        // Try direct fetch first (more reliable)
        try {
          const response = await fetch('/202502281839.csv');
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const csvText = await response.text();
          console.log('CSV data fetched successfully via direct fetch');
          processCSVData(csvText);
        } catch (fetchError) {
          console.error('Error with direct fetch:', fetchError);
          
          // Fallback to window.fs if direct fetch fails
          try {
            console.log('Trying fallback with window.fs...');
            const csvText = await window.fs.readFile('202502281839.csv', { encoding: 'utf8' });
            console.log('CSV data fetched successfully via window.fs');
            processCSVData(csvText);
          } catch (fsError) {
            console.error('Error with window.fs fallback:', fsError);
            throw fsError;
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    const processCSVData = (csvText) => {
      console.log('Processing CSV data...');
      console.log('First 100 chars of CSV:', csvText.substring(0, 100));
      
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log('Papa parse complete, rows:', results.data.length);
          console.log('Sample row:', results.data[0]);
          
          setData(results.data);
          
          // Calculate totals
          const total = _.sumBy(results.data, 'total_transactions');
          const totalFraudCount = _.sumBy(results.data, 'fraud_transactions');
          setTotalTransactions(total);
          setTotalFraud(totalFraudCount);
          
          setLoading(false);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setLoading(false);
        }
      });
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      // Apply rule based on current thresholds and operator
      let blockedCount = 0;
      let caughtFraudCount = 0;
      
      data.forEach(row => {
        const isScoreBlocked = row.min_score >= scoreThreshold;
        const isAmountBlocked = row.min_amount >= amountThreshold;
        
        // Check if this bucket is blocked based on the selected operator
        const isBlocked = operator === 'AND' 
          ? (isScoreBlocked && isAmountBlocked)
          : (isScoreBlocked || isAmountBlocked);
        
        if (isBlocked) {
          blockedCount += row.total_transactions;
          caughtFraudCount += row.fraud_transactions;
        }
      });
      
      setBlockedTransactions(blockedCount);
      setBlockedPercentage((blockedCount / totalTransactions) * 100);
      setCaughtFraud((caughtFraudCount / totalFraud) * 100);
    }
  }, [data, scoreThreshold, amountThreshold, operator, totalTransactions, totalFraud]);

  const getColor = (value) => {
    // Color scale from white to red
    if (value === 0) return '#f8fafc';
    if (value < 0.5) return '#fee2e2';
    if (value < 1.0) return '#fecaca';
    if (value < 1.5) return '#fca5a5';
    if (value < 2.0) return '#f87171';
    if (value < 2.5) return '#ef4444';
    if (value < 3.0) return '#dc2626';
    if (value < 3.5) return '#b91c1c';
    if (value < 4.0) return '#991b1b';
    return '#7f1d1d';
  };

  const renderHeatmap = () => {
    if (loading || data.length === 0) return <div className="text-center p-8">Loading data...</div>;

    // Get unique bins
    const amountBins = _.sortBy(_.uniq(data.map(row => row.amount_percentile_bin)));
    const scoreBins = _.sortBy(_.uniq(data.map(row => row.score_percentile_bin)));

    // Create a lookup map for quick access
    const dataMap = {};
    data.forEach(row => {
      if (!dataMap[row.amount_percentile_bin]) {
        dataMap[row.amount_percentile_bin] = {};
      }
      dataMap[row.amount_percentile_bin][row.score_percentile_bin] = row;
    });

    // We'll sample the bins to make the visualization more manageable
    // Take every 5th bin for better visualization
    const sampleStep = 5;
    const sampledAmountBins = amountBins.filter((_, i) => i % sampleStep === 0);
    const sampledScoreBins = scoreBins.filter((_, i) => i % sampleStep === 0);

    return (
      <div className="overflow-auto">
        <div className="min-w-max">
          <div className="mb-2 flex justify-between items-center">
            <div className="text-xs text-gray-500">Fraud Score Percentile →</div>
            <div className="flex space-x-1 items-center">
              <div className="w-4 h-4 bg-gray-100"></div>
              <span className="text-xs">0%</span>
              <div className="w-4 h-4 bg-red-300"></div>
              <span className="text-xs">1%</span>
              <div className="w-4 h-4 bg-red-500"></div>
              <span className="text-xs">2%</span>
              <div className="w-4 h-4 bg-red-700"></div>
              <span className="text-xs">3%+</span>
            </div>
          </div>
          
          <div className="flex">
            <div className="mr-2 flex flex-col justify-center text-xs text-gray-500">
              <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
                Amount Percentile ↓
              </div>
            </div>

            <div>
              {/* Header row with score bins */}
              <div className="flex mb-1">
                <div className="w-12 flex-shrink-0"></div>
                {sampledScoreBins.map(score => (
                  <div key={score} className="w-8 text-center text-xs">{score}</div>
                ))}
              </div>
              
              {/* Data rows */}
              {sampledAmountBins.map(amount => (
                <div key={amount} className="flex mb-1">
                  <div className="w-12 text-xs flex items-center justify-end pr-2">{amount}</div>
                  {sampledScoreBins.map(score => {
                    const cell = dataMap[amount]?.[score];
                    if (!cell) return <div key={`${amount}-${score}`} className="w-8 h-8 bg-gray-100"></div>;
                    
                    const value = cell.fraud_percentage || 0;
                    
                    // Check if this cell would be blocked by our rule
                    const isScoreBlocked = cell.min_score >= scoreThreshold;
                    const isAmountBlocked = cell.min_amount >= amountThreshold;
                    const isBlocked = operator === 'AND' 
                      ? (isScoreBlocked && isAmountBlocked)
                      : (isScoreBlocked || isAmountBlocked);
                    
                    return (
                      <div 
                        key={`${amount}-${score}`} 
                        className={`w-8 h-8 flex items-center justify-center text-xs ${isBlocked ? 'border-2 border-black' : ''}`}
                        style={{ 
                          backgroundColor: getColor(value),
                          cursor: 'pointer'
                        }}
                        title={`Amount: $${cell.min_amount}-$${cell.max_amount}, Score: ${cell.min_score}-${cell.max_score}, Fraud: ${value.toFixed(2)}%`}
                      >
                        {isBlocked && <ShieldAlert size={12} className="text-black" />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTableView = () => {
    if (loading || data.length === 0) return <div className="text-center p-8">Loading data...</div>;
    
    // Get blocked buckets
    const blockedBuckets = data.filter(row => {
      const isScoreBlocked = row.min_score >= scoreThreshold;
      const isAmountBlocked = row.min_amount >= amountThreshold;
      return operator === 'AND' 
        ? (isScoreBlocked && isAmountBlocked)
        : (isScoreBlocked || isAmountBlocked);
    });
    
    // Sort by fraud percentage
    const sortedBuckets = _.orderBy(blockedBuckets, ['fraud_percentage'], ['desc']);
    const topBuckets = sortedBuckets.slice(0, 20);
    
    return (
      <div className="overflow-auto max-h-96">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border text-left">Amount Range</th>
              <th className="p-2 border text-left">Score Range</th>
              <th className="p-2 border text-right">Transactions</th>
              <th className="p-2 border text-right">Fraud %</th>
              <th className="p-2 border text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {topBuckets.map((row, index) => {
              const isScoreBlocked = row.min_score >= scoreThreshold;
              const isAmountBlocked = row.min_amount >= amountThreshold;
              
              return (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="p-2 border">
                    ${row.min_amount.toFixed(2)} - ${row.max_amount.toFixed(2)}
                    <div className="text-xs text-gray-500">
                      {isAmountBlocked && <Badge className="bg-red-100 text-red-800">Blocked by Amount Rule</Badge>}
                    </div>
                  </td>
                  <td className="p-2 border">
                    {row.min_score} - {row.max_score}
                    <div className="text-xs text-gray-500">
                      {isScoreBlocked && <Badge className="bg-blue-100 text-blue-800">Blocked by Score Rule</Badge>}
                    </div>
                  </td>
                  <td className="p-2 border text-right">
                    {row.total_transactions.toLocaleString()}
                    <div className="text-xs text-gray-500">{row.fraud_transactions} fraud</div>
                  </td>
                  <td className="p-2 border text-right font-medium" style={{ color: getColor(row.fraud_percentage) }}>
                    {row.fraud_percentage.toFixed(2)}%
                  </td>
                  <td className="p-2 border text-center">
                    <Badge className="bg-red-600">Blocked</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Fraud Rule Configuration Dashboard</CardTitle>
        <CardDescription>
          Define concrete blocking rules based on transaction scores and amounts
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="p-4 border rounded-md bg-gray-50">
            <div className="text-lg font-bold mb-2 flex items-center">
              <Filter className="mr-2" size={18} />
              Rule Definition
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-4">
                <div className="font-medium flex items-center min-w-32">
                  <ShieldAlert className="mr-1 text-red-600" size={16} />
                  Block if:
                </div>
                <div className="flex-1">
                  <div className="p-3 border bg-white rounded-md">
                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
                      <div className="text-sm font-medium whitespace-nowrap flex items-center">
                        <span>Score</span> 
                        <span className="mx-2">≥</span>
                        <span className="text-red-600 font-bold">{scoreThreshold}</span>
                      </div>
                      
                      <div className="text-center px-2 font-bold">
                        <select 
                          value={operator}
                          onChange={(e) => setOperator(e.target.value)}
                          className="bg-gray-100 border border-gray-300 rounded p-1"
                        >
                          <option value="OR">OR</option>
                          <option value="AND">AND</option>
                        </select>
                      </div>
                      
                      <div className="text-sm font-medium whitespace-nowrap flex items-center">
                        <span>Amount</span> 
                        <span className="mx-2">≥</span>
                        <span className="text-red-600 font-bold">${amountThreshold.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 flex items-center">
                          <ShieldAlert className="text-red-600" size={16} />
                        </div>
                        <div className="flex-1">
                          <Slider 
                            value={[scoreThreshold]} 
                            min={minScore} 
                            max={maxScore} 
                            step={1} 
                            onValueChange={(value) => setScoreThreshold(value[0])} 
                          />
                        </div>
                        <div className="w-16 text-right font-medium">{scoreThreshold}</div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="w-12 flex items-center">
                          <DollarSign className="text-green-600" size={16} />
                        </div>
                        <div className="flex-1">
                          <Slider 
                            value={[amountThreshold]} 
                            min={minAmount} 
                            max={maxAmount} 
                            step={1} 
                            onValueChange={(value) => setAmountThreshold(value[0])} 
                          />
                        </div>
                        <div className="w-16 text-right font-medium">${amountThreshold.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-center">{blockedPercentage.toFixed(2)}%</div>
                  <div className="text-sm text-center text-gray-500">Transactions Blocked</div>
                  <div className="text-xs text-center text-gray-400">{blockedTransactions.toLocaleString()} of {totalTransactions.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-center">{caughtFraud.toFixed(2)}%</div>
                  <div className="text-sm text-center text-gray-500">Fraud Caught</div>
                  <div className="text-xs text-center text-gray-400">Of total {totalFraud.toLocaleString()} fraudulent transactions</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-xl font-bold text-center">
                    {(caughtFraud / blockedPercentage).toFixed(2)}
                  </div>
                  <div className="text-sm text-center text-gray-500">Effectiveness Ratio</div>
                  <div className="text-xs text-center text-gray-400">
                    (% Fraud Caught / % Txns Blocked)
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Tabs defaultValue="heatmap" onValueChange={setView} value={view}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="heatmap">Heatmap View</TabsTrigger>
              <TabsTrigger value="table">Blocked Groups</TabsTrigger>
            </TabsList>
            <TabsContent value="heatmap" className="mt-4">
              {renderHeatmap()}
            </TabsContent>
            <TabsContent value="table" className="mt-4">
              {renderTableView()}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      
      <CardFooter className="text-xs text-gray-500 flex flex-col items-start">
        <div className="mb-1">
          Areas with black borders in the heatmap represent blocked transaction groups.
        </div>
        <div>
          Rule: Block transactions where {operator === 'AND' ? 'both conditions are met' : 'either condition is met'}.
        </div>
      </CardFooter>
    </Card>
  );
};

export default FraudRiskDashboard;
