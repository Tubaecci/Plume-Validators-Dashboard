import streamlit as st
import pandas as pd
import plotly.express as px
import joblib
import os
from dune_client.client import DuneClient
from dune_client.query import QueryBase
from dotenv import load_dotenv

# Page config
st.set_page_config(
    page_title="Plume Validators Dashboard",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load data
df_dune_overall = joblib.load('database/df_dune_overall.joblib')
df_dune_daily = joblib.load('database/df_dune_daily.joblib')


# Sidebar
with st.sidebar:
    # Refresh Data Button (move to top)
    if st.button("🔄 Refresh Data"):
        with st.spinner("Refreshing data from Dune..."):
            load_dotenv(dotenv_path=".env")
            dune_api_key = os.getenv("DUNE_API")
            dune = DuneClient(api_key=dune_api_key)

            # Refresh and fetch overall data
            query_overall = QueryBase(query_id=5925380)
            dune.refresh(query_overall)
            result_overall = dune.get_latest_result(5925380)
            df_dune_overall = pd.DataFrame(result_overall.get_rows())
            joblib.dump(df_dune_overall, "database/df_dune_overall.joblib")

            # Refresh and fetch daily data
            query_daily = QueryBase(query_id=5927491)
            dune.refresh(query_daily)
            result_daily = dune.get_latest_result(5927491)
            df_dune_daily = pd.DataFrame(result_daily.get_rows())
            joblib.dump(df_dune_daily, "database/df_dune_daily.joblib")

        st.success("Data refreshed! Please reload the page to see the latest data.")

    st.markdown(
        """
        <div style="background: linear-gradient(90deg, #FFB300 0%, #FF6F00 50%, #FF1744 100%); padding: 10px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: white; text-align: center; margin: 0;">🪶 Plume Validators Dashboard</h3>
        </div>
        """,
        unsafe_allow_html=True
    )
    st.markdown(
        """
        ### 
        This dashboard is your interactive portal for exploring and analyzing validator activity on the Plume blockchain. This dashboard provides insights into validator performance, staking trends, and key network statistics, all in a visually engaging and easy-to-use interface.

        With this tool, you can:
        - Monitor validator performance and participation across different timeframes.
        - Visualize staking rewards, active stake, and validator distribution with dynamic charts.
        - Access a comprehensive overview of the Plume network, including validator counts, network health, and staking metrics.

        Whether you're a validator operator, network participant, or simply interested in the Plume ecosystem, this dashboard helps you stay informed and make data-driven decisions. Built using Streamlit, Pandas, Plotly, and other modern Python libraries, it brings Plume's validator data to your fingertips.
        """,
        unsafe_allow_html=True
    )

# Navigation buttons 
section = st.radio(
    "Navigate to Section",
    ["Overview", "Validator Performance", "Staking Rewards"],
    index=0,  # Default to Overview
    format_func=lambda x: x,  # Display labels as-is
    horizontal=True,  # Horizontal layout
    key="nav_radio",
    help="Select a section to explore the dashboard."
)

st.markdown(
    """
    <style>
    div[role="radiogroup"] {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
    }
    div[role="radiogroup"] label {
        margin: 0 15px;
        font-size: 18px;
        color: #fff;
        background: linear-gradient(90deg, #FFB300 0%, #FF6F00 50%, #FF1744 100%);
        padding: 8px 16px;
        border-radius: 5px;
        transition: background 0.3s;
        border: none;
    }
    div[role="radiogroup"] label:hover {
        background: linear-gradient(90deg, #FFD740 0%, #FF8A65 50%, #FF5252 100%);
    }
    div[role="radiogroup"] input[type="radio"]:checked + label {
        background: linear-gradient(90deg, #FFD740 0%, #FF8A65 50%, #FF5252 100%);
        color: #fff;
    }
    </style>
    """,
    unsafe_allow_html=True
)

# -- Overview Section
if section == "Overview":
    st.subheader("Network Overview")

    # Calculate metrics
    num_validators = df_dune_overall['validator'].nunique()
    total_plume_staked = df_dune_overall['plume_staked'].sum()

    # Calculate % Share for each validator
    df_overview = df_dune_overall.copy()
    df_overview['% Share'] = (df_overview['plume_staked'] / total_plume_staked) * 100

    # Format PLUME Staked and Stakers with commas
    df_overview['plume_staked_fmt'] = df_overview['plume_staked'].apply(lambda x: f"{x:,.0f}")
    df_overview['stakers_fmt'] = df_overview['stakers'].apply(lambda x: f"{x:,.0f}")

    # Select and order columns, and sort by plume_staked descending
    df_overview_table = df_overview[['validator', 'plume_staked', 'plume_staked_fmt', '% Share', 'stakers_fmt', 'commission']]
    df_overview_table = df_overview_table.sort_values('plume_staked', ascending=False)
    df_overview_table = df_overview_table[['validator', 'plume_staked_fmt', '% Share', 'stakers_fmt', 'commission']]
    df_overview_table.columns = ['Validator', 'PLUME Staked', '% Share', 'Stakers', 'Commission %']

    # Show metrics
    col1, col2 = st.columns(2)
    col1.metric("Number of Validators", f"{num_validators}")
    col2.metric("Total PLUME Staked", f"{total_plume_staked:,.0f}")

    st.markdown("### Validator Overview Table")
    st.dataframe(df_overview_table, use_container_width=True)

    # Pie chart of PLUME staked by validator
    st.markdown("### PLUME Staked Distribution by Validator")
    fig = px.pie(
        df_overview,
        names='validator',
        values='plume_staked',
        title='PLUME Staked per Validator',
        hole=0.4
    )
    st.plotly_chart(fig, use_container_width=True)
# -- Validator Performance Section
if section == "Validator Performance":
    st.subheader("Validator Performance")

    # Define unique colors for each validator (updated names)
    validator_colors = {
        "Plume Foundation": "#1976D2",    # blue
        "Hello Moon": "#FFB300",          # orange
        "DSRV": "#43A047",                # green
        "SBI_DeFimans": "#D32F2F",        # red
        "Bioeconomy": "#7B1FA2",          # purple
        "Korea Web3 Embassy": "#00838F",  # teal
        "PNP MAX": "#FBC02D",             # yellow
        "CoinSummer labs": "#C2185B",     # pink
        "Republic": "#388E3C",            # dark green
        "Nano Labs": "#F57C00",           # deep orange
    }
    default_color = "#607D8B"  # grey-blue fallback

    # Get top 10 validators by total amount staked
    top_validators = (
        df_dune_overall.sort_values("plume_staked", ascending=False)
        .head(10)["validator"]
        .tolist()
    )

    selected_validator = st.selectbox(
        "Select a Validator",
        top_validators,
        index=0,
        help="Choose a validator to view detailed performance metrics."
    )

    # Pick color for selected validator
    chart_color = validator_colors.get(selected_validator, default_color)

    # Filter daily data for selected validator
    df_validator = df_dune_daily[df_dune_daily["validator"] == selected_validator].copy()
    df_validator = df_validator.sort_values("date")

    # Format amount_staked and stakers with commas for tooltips
    df_validator["amount_staked_fmt"] = df_validator["amount_staked"].apply(lambda x: f"{x:,.0f}")
    df_validator["stakers_fmt"] = df_validator["stakers"].apply(lambda x: f"{x:,.0f}")

    # Round growth columns to 3 decimals
    for col in [
        "amount_staked_growth_24h", "amount_staked_growth_7D", "amount_staked_growth_30D",
        "stakers_growth_24h", "stakers_growth_7D", "stakers_growth_30D"
    ]:
        if col in df_validator.columns:
            df_validator[col] = df_validator[col].round(3)

    # Daily PLUME Staked (area chart with formatted hover)
    st.markdown("#### Daily PLUME Staked")
    fig_staked = px.area(
        df_validator,
        x="date",
        y="amount_staked",
        title=None,
        color_discrete_sequence=[chart_color],
        custom_data=["amount_staked_fmt"]
    )
    fig_staked.update_traces(
        hovertemplate="Date: %{x}<br>PLUME Staked: %{customdata[0]}"
    )
    fig_staked.update_layout(showlegend=False, xaxis_title=None, yaxis_title="PLUME Staked")
    st.plotly_chart(fig_staked, use_container_width=True)

    # Daily PLUME Staked Growth (24h)
    st.markdown("#### Daily PLUME Staked Growth % (24h)")
    fig_growth_24h = px.line(
        df_validator,
        x="date",
        y="amount_staked_growth_24h",
        color_discrete_sequence=[chart_color],
        markers=True
    )
    fig_growth_24h.update_traces(
        hovertemplate="Date: %{x}<br>Growth (24h): %{y:.3f}%"
    )
    fig_growth_24h.update_layout(showlegend=False, xaxis_title=None, yaxis_title="Growth (24h) %")
    st.plotly_chart(fig_growth_24h, use_container_width=True)

    # Daily PLUME Staked Growth (7D)
    st.markdown("#### Daily PLUME Staked Growth % (7D)")
    fig_growth_7d = px.line(
        df_validator,
        x="date",
        y="amount_staked_growth_7D",
        color_discrete_sequence=[chart_color],
        markers=True
    )
    fig_growth_7d.update_traces(
        hovertemplate="Date: %{x}<br>Growth (7D): %{y:.3f}%"
    )
    fig_growth_7d.update_layout(showlegend=False, xaxis_title=None, yaxis_title="Growth (7D) %")
    st.plotly_chart(fig_growth_7d, use_container_width=True)

    # Daily PLUME Staked Growth (30D)
    st.markdown("#### Daily PLUME Staked Growth % (30D)")
    fig_growth_30d = px.line(
        df_validator,
        x="date",
        y="amount_staked_growth_30D",
        color_discrete_sequence=[chart_color],
        markers=True
    )
    fig_growth_30d.update_traces(
        hovertemplate="Date: %{x}<br>Growth (30D): %{y:.3f}%"
    )
    fig_growth_30d.update_layout(showlegend=False, xaxis_title=None, yaxis_title="Growth (30D) %")
    st.plotly_chart(fig_growth_30d, use_container_width=True)

    # Daily Stakers (bar chart with formatted hover)
    st.markdown("#### Daily Stakers")
    fig_stakers = px.bar(
        df_validator,
        x="date",
        y="stakers",
        color_discrete_sequence=[chart_color],
        custom_data=["stakers_fmt"]
    )
    fig_stakers.update_traces(
        hovertemplate="Date: %{x}<br>Stakers: %{customdata[0]}"
    )
    fig_stakers.update_layout(showlegend=False, xaxis_title=None, yaxis_title="Stakers")
    st.plotly_chart(fig_stakers, use_container_width=True)

    # Daily Stakers Growth (24h)
    st.markdown("#### Daily Stakers Growth % (24h)")
    fig_stakers_growth_24h = px.line(
        df_validator,
        x="date",
        y="stakers_growth_24h",
        color_discrete_sequence=[chart_color],
        markers=True
    )
    fig_stakers_growth_24h.update_traces(
        hovertemplate="Date: %{x}<br>Stakers Growth (24h): %{y:.3f}%"
    )
    fig_stakers_growth_24h.update_layout(showlegend=False, xaxis_title=None, yaxis_title="Stakers Growth (24h) %")
    st.plotly_chart(fig_stakers_growth_24h, use_container_width=True)

    # Daily Stakers Growth (7D)
    st.markdown("#### Daily Stakers Growth % (7D)")
    fig_stakers_growth_7d = px.line(
        df_validator,
        x="date",
        y="stakers_growth_7D",
        color_discrete_sequence=[chart_color],
        markers=True
    )
    fig_stakers_growth_7d.update_traces(
        hovertemplate="Date: %{x}<br>Stakers Growth (7D): %{y:.3f}%"
    )
    fig_stakers_growth_7d.update_layout(showlegend=False, xaxis_title=None, yaxis_title="Stakers Growth (7D) %")
    st.plotly_chart(fig_stakers_growth_7d, use_container_width=True)

    # Daily Stakers Growth (30D)
    st.markdown("#### Daily Stakers Growth % (30D)")
    fig_stakers_growth_30d = px.line(
        df_validator,
        x="date",
        y="stakers_growth_30D",
        color_discrete_sequence=[chart_color],
        markers=True
    )
    fig_stakers_growth_30d.update_traces(
        hovertemplate="Date: %{x}<br>Stakers Growth (30D): %{y:.3f}%"
    )
    fig_stakers_growth_30d.update_layout(showlegend=False, xaxis_title=None, yaxis_title="Stakers Growth (30D) %")
    st.plotly_chart(fig_stakers_growth_30d, use_container_width=True)

# -- Staking Rewards Section : Coming Soon
if section == "Staking Rewards":
    st.subheader("Staking Rewards")
    st.markdown(
        """
        <div style="text-align:center; padding: 40px;">
            <h1 style="color:#FF6F00;">COMING SOON...</h1>
            <p style="font-size:18px;">Staking rewards analytics will be available here soon. Stay tuned!</p>
        </div>
        """,
        unsafe_allow_html=True
    )
