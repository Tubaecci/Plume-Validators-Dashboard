"""
Plume Validators FastAPI Application
Save this file as: api.py (NOT main.py or fastapi.py)
Run with: uvicorn api:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import joblib
import os
from dune_client.client import DuneClient
from dune_client.query import QueryBase
from dotenv import load_dotenv
import asyncio
from datetime import datetime
from functools import wraps

# Initialize FastAPI app
app = FastAPI(
    title="Plume Validators API",
    description="API for exploring and analyzing validator activity on the Plume blockchain",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv(dotenv_path=".env")

# Global data holders
df_dune_overall: Optional[pd.DataFrame] = None
df_dune_daily: Optional[pd.DataFrame] = None
last_refresh: Optional[datetime] = None
refresh_in_progress: bool = False

# Pydantic models for responses
class ValidatorOverview(BaseModel):
    validator: str
    plume_staked: str
    share_percent: float
    stakers: str
    commission: float

class NetworkOverview(BaseModel):
    num_validators: int
    total_plume_staked: str
    validators: List[ValidatorOverview]

class ValidatorPerformance(BaseModel):
    date: str
    amount_staked: str
    amount_staked_growth_24h: Optional[float]
    amount_staked_growth_7D: Optional[float]
    amount_staked_growth_30D: Optional[float]
    stakers: str
    stakers_growth_24h: Optional[float]
    stakers_growth_7D: Optional[float]
    stakers_growth_30D: Optional[float]

class RefreshStatus(BaseModel):
    status: str
    message: str
    last_refresh: Optional[str]
    refresh_in_progress: bool

# Helper functions
def load_data():
    """Load data from joblib files"""
    global df_dune_overall, df_dune_daily, last_refresh
    try:
        df_dune_overall = joblib.load('database/df_dune_overall.joblib')
        df_dune_daily = joblib.load('database/df_dune_daily.joblib')
        if last_refresh is None:
            last_refresh = datetime.now()
        print(f"✅ Data loaded successfully at {datetime.now()}")
    except FileNotFoundError as e:
        print(f"❌ Error loading data: {e}")
        raise HTTPException(status_code=500, detail=f"Data files not found: {e}")

async def refresh_dune_data():
    """Refresh data from Dune Analytics asynchronously"""
    global df_dune_overall, df_dune_daily, last_refresh, refresh_in_progress
    
    if refresh_in_progress:
        print("⚠️ Refresh already in progress, skipping...")
        return
    
    refresh_in_progress = True
    print("🔄 Starting data refresh from Dune...")
    
    dune_api_key = os.getenv("DUNE_API_KEY") or os.getenv("DUNE_API")
    if not dune_api_key:
        refresh_in_progress = False
        print("❌ DUNE API key not found")
        raise HTTPException(status_code=500, detail="DUNE API key not found")
    
    try:
        # Run blocking Dune API calls in thread pool
        loop = asyncio.get_event_loop()
        
        def fetch_dune_data():
            dune = DuneClient(api_key=dune_api_key)
            
            # Refresh and fetch overall data
            print("  📊 Fetching overall data...")
            query_overall = QueryBase(query_id=5925380)
            dune.refresh(query_overall)
            result_overall = dune.get_latest_result(5925380)
            df_overall = pd.DataFrame(result_overall.get_rows())
            joblib.dump(df_overall, "database/df_dune_overall.joblib")
            
            # Refresh and fetch daily data
            print("  📊 Fetching daily data...")
            query_daily = QueryBase(query_id=5927491)
            dune.refresh(query_daily)
            result_daily = dune.get_latest_result(5927491)
            df_daily = pd.DataFrame(result_daily.get_rows())
            joblib.dump(df_daily, "database/df_dune_daily.joblib")
            
            return df_overall, df_daily
        
        df_dune_overall, df_dune_daily = await loop.run_in_executor(None, fetch_dune_data)
        last_refresh = datetime.now()
        print(f"✅ Data refresh completed at {last_refresh}")
        
    except Exception as e:
        print(f"❌ Failed to refresh data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh data: {e}")
    finally:
        refresh_in_progress = False

# Startup event
@app.on_event("startup")
async def startup_event():
    """Load data on startup"""
    print("🚀 Starting Plume Validators API...")
    load_data()
    print("✅ API ready!")

# API Endpoints
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "🪶 Plume Validators API",
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs",
        "endpoints": {
            "network_overview": "/api/overview",
            "validator_list": "/api/validators",
            "validator_performance": "/api/validator/{validator_name}",
            "stake_distribution": "/api/distribution",
            "refresh_data": "/api/refresh (POST)",
            "refresh_status": "/api/refresh/status",
            "health": "/api/health"
        }
    }

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "last_refresh": last_refresh.isoformat() if last_refresh else None,
        "data_loaded": df_dune_overall is not None and df_dune_daily is not None,
        "refresh_in_progress": refresh_in_progress,
        "num_validators": df_dune_overall['validator'].nunique() if df_dune_overall is not None else 0
    }

@app.get("/api/overview", response_model=NetworkOverview, tags=["Overview"])
async def get_network_overview():
    """Get network overview with validator statistics"""
    if df_dune_overall is None:
        raise HTTPException(status_code=500, detail="Data not loaded. Please wait for initialization.")
    
    num_validators = df_dune_overall['validator'].nunique()
    total_plume_staked = df_dune_overall['plume_staked'].sum()
    
    # Calculate % Share for each validator
    df_overview = df_dune_overall.copy()
    df_overview['share_percent'] = (df_overview['plume_staked'] / total_plume_staked) * 100
    df_overview = df_overview.sort_values('plume_staked', ascending=False)
    
    validators = []
    for _, row in df_overview.iterrows():
        validators.append(ValidatorOverview(
            validator=row['validator'],
            plume_staked=f"{row['plume_staked']:,.0f}",
            share_percent=round(row['share_percent'], 2),
            stakers=f"{row['stakers']:,.0f}",
            commission=row['commission']
        ))
    
    return NetworkOverview(
        num_validators=num_validators,
        total_plume_staked=f"{total_plume_staked:,.0f}",
        validators=validators
    )

@app.get("/api/validators", tags=["Validators"])
async def get_validators():
    """Get list of all validators sorted by stake"""
    if df_dune_overall is None:
        raise HTTPException(status_code=500, detail="Data not loaded. Please wait for initialization.")
    
    validators = df_dune_overall.sort_values('plume_staked', ascending=False)['validator'].tolist()
    return {
        "count": len(validators),
        "validators": validators
    }

@app.get("/api/validator/{validator_name}", response_model=List[ValidatorPerformance], tags=["Validators"])
async def get_validator_performance(validator_name: str):
    """Get performance data for a specific validator"""
    if df_dune_daily is None:
        raise HTTPException(status_code=500, detail="Data not loaded. Please wait for initialization.")
    
    # Filter data for the validator
    df_validator = df_dune_daily[df_dune_daily['validator'] == validator_name].copy()
    
    if df_validator.empty:
        # Get available validators for helpful error message
        available = df_dune_daily['validator'].unique().tolist()
        raise HTTPException(
            status_code=404, 
            detail=f"Validator '{validator_name}' not found. Available validators: {available[:5]}..."
        )
    
    df_validator = df_validator.sort_values('date')
    
    # Round growth columns
    growth_cols = [
        "amount_staked_growth_24h", "amount_staked_growth_7D", "amount_staked_growth_30D",
        "stakers_growth_24h", "stakers_growth_7D", "stakers_growth_30D"
    ]
    for col in growth_cols:
        if col in df_validator.columns:
            df_validator[col] = df_validator[col].round(3)
    
    performance_data = []
    for _, row in df_validator.iterrows():
        performance_data.append(ValidatorPerformance(
            date=str(row['date']),
            amount_staked=f"{row['amount_staked']:,.0f}",
            amount_staked_growth_24h=row.get('amount_staked_growth_24h'),
            amount_staked_growth_7D=row.get('amount_staked_growth_7D'),
            amount_staked_growth_30D=row.get('amount_staked_growth_30D'),
            stakers=f"{row['stakers']:,.0f}",
            stakers_growth_24h=row.get('stakers_growth_24h'),
            stakers_growth_7D=row.get('stakers_growth_7D'),
            stakers_growth_30D=row.get('stakers_growth_30D')
        ))
    
    return performance_data

@app.post("/api/refresh", response_model=RefreshStatus, tags=["Data Management"])
async def refresh_data(background_tasks: BackgroundTasks):
    """Trigger data refresh from Dune Analytics"""
    if refresh_in_progress:
        return RefreshStatus(
            status="in_progress",
            message="Data refresh is already in progress",
            last_refresh=last_refresh.isoformat() if last_refresh else None,
            refresh_in_progress=True
        )
    
    background_tasks.add_task(refresh_dune_data)
    
    return RefreshStatus(
        status="started",
        message="Data refresh started in background. Check /api/refresh/status for progress.",
        last_refresh=last_refresh.isoformat() if last_refresh else None,
        refresh_in_progress=True
    )

@app.get("/api/refresh/status", response_model=RefreshStatus, tags=["Data Management"])
async def get_refresh_status():
    """Get the status of the last data refresh"""
    if refresh_in_progress:
        status = "in_progress"
        message = "Data refresh is currently in progress..."
    elif last_refresh:
        status = "complete"
        message = f"Data was last refreshed at {last_refresh.strftime('%Y-%m-%d %H:%M:%S')}"
    else:
        status = "never_refreshed"
        message = "Data has never been refreshed via API"
    
    return RefreshStatus(
        status=status,
        message=message,
        last_refresh=last_refresh.isoformat() if last_refresh else None,
        refresh_in_progress=refresh_in_progress
    )

@app.get("/api/distribution", tags=["Analytics"])
async def get_stake_distribution():
    """Get PLUME stake distribution data for visualization"""
    if df_dune_overall is None:
        raise HTTPException(status_code=500, detail="Data not loaded. Please wait for initialization.")
    
    df_overview = df_dune_overall.copy()
    total_plume_staked = df_overview['plume_staked'].sum()
    
    distribution = []
    for _, row in df_overview.iterrows():
        distribution.append({
            "validator": row['validator'],
            "plume_staked": float(row['plume_staked']),
            "percentage": round((row['plume_staked'] / total_plume_staked) * 100, 2),
            "stakers": int(row['stakers']),
            "commission": float(row['commission'])
        })
    
    return {
        "total_plume_staked": float(total_plume_staked),
        "distribution": sorted(distribution, key=lambda x: x['plume_staked'], reverse=True)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)