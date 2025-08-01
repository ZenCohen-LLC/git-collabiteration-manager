-- Universal test data setup for all iterations
-- Creates comprehensive test data including all campaign types

DO $$
DECLARE
  stage_record RECORD;
  campaign_num INT;
  campaign_id UUID;
  user_id UUID;
BEGIN
  -- Ensure test user exists with all required fields
  SELECT id INTO user_id FROM media_tool.users WHERE email = 'test@mail.com';
  IF user_id IS NULL THEN
    INSERT INTO media_tool.users (id, email, name, zoho_user_id, created_at, updated_at)
    VALUES (gen_random_uuid(), 'test@mail.com', 'Test User', 'test-zoho-id', NOW(), NOW())
    RETURNING id INTO user_id;
  END IF;

  -- Create 2 campaigns for each campaign stage
  FOR stage_record IN 
    SELECT unnest(enum_range(NULL::media_tool.campaign_stage)) as stage
  LOOP
    FOR campaign_num IN 1..2 LOOP
      campaign_id := gen_random_uuid();
      
      -- Create campaign with varying configurations
      INSERT INTO media_tool.campaigns (
        id, 
        name, 
        stage, 
        campaign_number,
        agency_gross_margin_pct, 
        referral_partner_commission_pct,
        description,
        start_date,
        end_date,
        created_at, 
        updated_at,
        created_by,
        updated_by
      ) VALUES (
        campaign_id,
        stage_record.stage || ' Test Campaign ' || campaign_num,
        stage_record.stage,
        'TEST-' || substring(campaign_id::text, 1, 8),
        CASE 
          WHEN campaign_num = 1 THEN 0.15  -- 15% markup
          ELSE 0 
        END,
        CASE 
          WHEN campaign_num = 2 THEN 0.10  -- 10% referral
          ELSE 0 
        END,
        'Test campaign for ' || stage_record.stage || ' stage testing',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '90 days',
        NOW(), 
        NOW(),
        user_id,
        user_id
      ) ON CONFLICT DO NOTHING;
      
      -- Add diverse line items for each campaign
      -- 1. Standard Display Line Item
      INSERT INTO media_tool.line_items (
        id, 
        campaign_id, 
        name, 
        line_item_type, 
        impressions, 
        net_unit_cost,
        start_date,
        end_date,
        media_type,
        ad_format,
        created_at, 
        updated_at,
        created_by,
        updated_by
      ) VALUES (
        gen_random_uuid(), 
        campaign_id, 
        'Display - Standard Banner', 
        'standard', 
        1000000,  -- 1M impressions
        5.00,     -- $5 CPM
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'Display',
        ARRAY['Banner', 'Responsive']::text[],
        NOW(), 
        NOW(),
        user_id,
        user_id
      ) ON CONFLICT DO NOTHING;

      -- 2. Video Line Item
      INSERT INTO media_tool.line_items (
        id, 
        campaign_id, 
        name, 
        line_item_type, 
        impressions, 
        net_unit_cost,
        start_date,
        end_date,
        media_type,
        ad_format,
        created_at, 
        updated_at,
        created_by,
        updated_by
      ) VALUES (
        gen_random_uuid(), 
        campaign_id, 
        'Video - Pre-roll', 
        'standard', 
        500000,   -- 500K impressions
        25.00,    -- $25 CPM
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'Video',
        ARRAY['Pre-roll', 'Mid-roll']::text[],
        NOW(), 
        NOW(),
        user_id,
        user_id
      ) ON CONFLICT DO NOTHING;

      -- 3. Management Fee Line Item
      INSERT INTO media_tool.line_items (
        id, 
        campaign_id, 
        name, 
        line_item_type, 
        impressions, 
        net_unit_cost,
        start_date,
        end_date,
        media_type,
        created_at, 
        updated_at,
        created_by,
        updated_by
      ) VALUES (
        gen_random_uuid(), 
        campaign_id, 
        'Campaign Management Fee', 
        'management_fee', 
        0,        -- No impressions for fees
        2500.00,  -- $2,500 flat fee
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '90 days',
        'Fee',
        NOW(), 
        NOW(),
        user_id,
        user_id
      ) ON CONFLICT DO NOTHING;

      -- 4. Zero Dollar Line Item
      INSERT INTO media_tool.line_items (
        id, 
        campaign_id, 
        name, 
        line_item_type, 
        impressions, 
        net_unit_cost,
        start_date,
        end_date,
        media_type,
        ad_format,
        created_at, 
        updated_at,
        created_by,
        updated_by
      ) VALUES (
        gen_random_uuid(), 
        campaign_id, 
        'Social Media - Organic', 
        'zero_dollar', 
        250000,   -- 250K impressions
        0.00,     -- $0 cost
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '60 days',
        'Social',
        ARRAY['Post', 'Story']::text[],
        NOW(), 
        NOW(),
        user_id,
        user_id
      ) ON CONFLICT DO NOTHING;

      -- 5. Native Advertising (if applicable)
      IF campaign_num = 1 THEN
        INSERT INTO media_tool.line_items (
          id, 
          campaign_id, 
          name, 
          line_item_type, 
          impressions, 
          net_unit_cost,
          start_date,
          end_date,
          media_type,
          ad_format,
          created_at, 
          updated_at,
          created_by,
          updated_by
        ) VALUES (
          gen_random_uuid(), 
          campaign_id, 
          'Native - Content Distribution', 
          'standard', 
          200000,   -- 200K impressions
          15.00,    -- $15 CPM
          CURRENT_DATE + INTERVAL '15 days',
          CURRENT_DATE + INTERVAL '45 days',
          'Native',
          ARRAY['In-feed', 'Recommendation']::text[],
          NOW(), 
          NOW(),
          user_id,
          user_id
        ) ON CONFLICT DO NOTHING;
      END IF;

    END LOOP;
  END LOOP;

  -- Add a special test campaign with all line item types
  campaign_id := gen_random_uuid();
  INSERT INTO media_tool.campaigns (
    id, 
    name, 
    stage, 
    campaign_number,
    agency_gross_margin_pct, 
    referral_partner_commission_pct,
    description,
    start_date,
    end_date,
    created_at, 
    updated_at,
    created_by,
    updated_by
  ) VALUES (
    campaign_id,
    'Complete Test Campaign - All Types',
    'Executing Buy',
    'TEST-COMPLETE',
    0.15,  -- 15% markup
    0.10,  -- 10% referral
    'Comprehensive test campaign with all line item types',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '60 days',
    NOW(), 
    NOW(),
    user_id,
    user_id
  ) ON CONFLICT DO NOTHING;

  -- Add one of each line item type to the complete campaign
  INSERT INTO media_tool.line_items (
    id, campaign_id, name, line_item_type, impressions, net_unit_cost,
    start_date, end_date, media_type, created_at, updated_at, created_by, updated_by
  )
  SELECT
    gen_random_uuid(),
    campaign_id,
    type_name,
    type_value,
    impressions,
    unit_cost,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    media_type,
    NOW(),
    NOW(),
    user_id,
    user_id
  FROM (
    VALUES 
      ('Standard Display', 'standard', 1000000, 5.00, 'Display'),
      ('Premium Video', 'standard', 500000, 30.00, 'Video'),
      ('Management Fee', 'management_fee', 0, 3000.00, 'Fee'),
      ('Zero Dollar Social', 'zero_dollar', 300000, 0.00, 'Social'),
      ('Native Content', 'standard', 250000, 12.00, 'Native'),
      ('Audio Streaming', 'standard', 750000, 4.00, 'Audio'),
      ('Connected TV', 'standard', 100000, 45.00, 'CTV'),
      ('Digital OOH', 'standard', 2000000, 3.50, 'DOOH')
  ) AS t(type_name, type_value, impressions, unit_cost, media_type)
  ON CONFLICT DO NOTHING;

END $$;

-- Create safe_divide function if it doesn't exist
CREATE OR REPLACE FUNCTION media_tool.safe_divide(numerator numeric, denominator numeric)
RETURNS numeric AS $$
BEGIN
    IF denominator = 0 OR denominator IS NULL THEN
        RETURN 0;
    ELSE
        RETURN numerator / denominator;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA media_tool TO media_tool;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA media_tool TO media_tool;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA media_tool TO media_tool;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA media_tool TO media_tool;

-- Summary of created test data
DO $$
DECLARE
  campaign_count INT;
  line_item_count INT;
  stage_list TEXT;
BEGIN
  SELECT COUNT(*) INTO campaign_count FROM media_tool.campaigns WHERE name LIKE '%Test Campaign%';
  SELECT COUNT(*) INTO line_item_count FROM media_tool.line_items WHERE campaign_id IN (
    SELECT id FROM media_tool.campaigns WHERE name LIKE '%Test Campaign%'
  );
  
  SELECT string_agg(DISTINCT stage::text, ', ' ORDER BY stage::text) INTO stage_list
  FROM media_tool.campaigns WHERE name LIKE '%Test Campaign%';

  RAISE NOTICE '✅ Test data creation complete:';
  RAISE NOTICE '   - Campaigns created: %', campaign_count;
  RAISE NOTICE '   - Line items created: %', line_item_count;
  RAISE NOTICE '   - Campaign stages: %', stage_list;
  RAISE NOTICE '   - Test user: test@mail.com';
END $$;