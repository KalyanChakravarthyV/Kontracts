import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY 
});

export interface ContractData {
  contractName: string;
  vendor: string;
  contractType: string;
  paymentTerms: string;
  nextPaymentDate: string;
  amount: number;
  startDate: string;
  endDate: string;
  description: string;
}

export interface PetFriendlyRecommendation {
  type: 'travel' | 'accommodation' | 'restaurant' | 'veterinary';
  title: string;
  description: string;
  location?: string;
  priority: 'low' | 'medium' | 'high';
}

export async function extractContractData(documentText: string): Promise<ContractData> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert contract analyst. Extract key contract information and return it as JSON. Respond with JSON in this format: { 'contractName': string, 'vendor': string, 'contractType': string, 'paymentTerms': string, 'nextPaymentDate': string, 'amount': number, 'startDate': string, 'endDate': string, 'description': string }"
        },
        {
          role: "user",
          content: `Extract the key contract information from this document:\n\n${documentText}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      contractName: result.contractName || 'Unknown Contract',
      vendor: result.vendor || 'Unknown Vendor',
      contractType: result.contractType || 'General',
      paymentTerms: result.paymentTerms || 'Net 30',
      nextPaymentDate: result.nextPaymentDate || new Date().toISOString(),
      amount: parseFloat(result.amount) || 0,
      startDate: result.startDate || new Date().toISOString(),
      endDate: result.endDate || new Date().toISOString(),
      description: result.description || 'Contract details extracted from document'
    };
  } catch (error) {
    throw new Error(`Failed to extract contract data: ${error.message}`);
  }
}

export async function generateAIRecommendations(
  userContext: {
    recentContracts: any[];
    upcomingPayments: any[];
    location?: string;
    pets?: any[];
  }
): Promise<PetFriendlyRecommendation[]> {
  try {
    const context = `
User context:
- Recent contracts: ${userContext.recentContracts.length}
- Upcoming payments: ${userContext.upcomingPayments.length}
- Location: ${userContext.location || 'Not specified'}
- Pets: ${userContext.pets?.length || 0}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that provides personalized recommendations for contract management and pet-friendly travel. Generate 3-5 relevant recommendations based on the user context. Respond with JSON in this format: { 'recommendations': [{ 'type': string, 'title': string, 'description': string, 'location': string, 'priority': string }] }"
        },
        {
          role: "user",
          content: `Generate personalized recommendations based on this context:\n\n${context}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
    return result.recommendations || [];
  } catch (error) {
    throw new Error(`Failed to generate AI recommendations: ${error.message}`);
  }
}

export async function analyzePetFriendlyPlaces(
  location: string,
  petRequirements: string[]
): Promise<any[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a travel expert specializing in pet-friendly accommodations and services. Generate realistic pet-friendly place recommendations based on location and pet requirements. Respond with JSON in this format: { 'places': [{ 'name': string, 'type': string, 'location': string, 'description': string, 'rating': number, 'priceRange': string, 'amenities': string[] }] }"
        },
        {
          role: "user",
          content: `Find pet-friendly places in ${location} with these requirements: ${petRequirements.join(', ')}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"places": []}');
    return result.places || [];
  } catch (error) {
    throw new Error(`Failed to analyze pet-friendly places: ${error.message}`);
  }
}

export async function generateContractInsights(contractData: any): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a contract administration expert. Analyze the contract data and provide insights about payment optimization, compliance risks, and renewal recommendations."
        },
        {
          role: "user",
          content: `Analyze this contract data and provide actionable insights:\n\n${JSON.stringify(contractData, null, 2)}`
        }
      ]
    });

    return response.choices[0].message.content || 'No insights available';
  } catch (error) {
    throw new Error(`Failed to generate contract insights: ${error.message}`);
  }
}
