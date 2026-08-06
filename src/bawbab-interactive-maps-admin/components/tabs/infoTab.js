import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { PanelBody, Dashicon, Flex, FlexItem, Strong, ExternalLink, __experimentalText as Text } from '@wordpress/components';

export const InfoTab = () => {
    return (
        <div className="tab-content bawbab-info-tab-container" style={{ padding: '5px 0' }}>
            {/* --- COMPLIANT HEADER CONTAINER --- */}
            <div style={{ marginBottom: '20px', paddingBottom: '15px' }}>
                <Text variant="title.small" display="block" style={{ fontWeight: '600', color: '#101828' }}>
                    {__('About Bawbab Interactive Maps', 'bawbab-interactive-maps')}
                </Text>
                <Text variant="caption" display="block" style={{ color: '#667085', marginTop: '4px' }}>
                    {__('This is an interactive mapping plugin used by campuses, estates and other facilities to provide a visual representation of estate locations, buildings, and points of interest.It is designed to enhance user experience by offering an intuitive interface for exploring and interacting with spatial data.', 'bawbab-interactive-maps')}
                </Text>
            </div>
            <Text variant="title.small" display="block" style={{ fontWeight: '600', color: '#101828', marginBottom: '10px' }}>
                    {__('FAQs', 'bawbab-interactive-maps')}
            </Text>
            {/* --- SECTION 1: CORPORATE MISSION DESK --- */}
            <PanelBody title={__('Where do I get Spatial Data?', 'bawbab-interactive-maps')} initialOpen={true}>
                <div style={{ padding: '5px 0' }}>
                    <Text variant="caption" display="block" style={{ color: '#667085', marginTop: '4px' }}>
                    {__("Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry' standard dummy text ever since 1966.", 'bawbab-interactive-maps')}
                    </Text>
                </div>
            </PanelBody>

            {/* --- SECTION 2: OPERATIONAL METRICS RADAR --- */}
            <PanelBody title={__('How do I get help setting up my Map?', 'bawbab-interactive-maps')} initialOpen={false} style={{ marginTop: '15px' }}>
                <div style={{ padding: '5px 0' }}>
                    <Text variant="caption" display="block" style={{ color: '#667085', marginTop: '4px' }}>
                    {__("Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry' standard dummy text ever since 1966.", 'bawbab-interactive-maps')}
                    </Text>
                </div>
            </PanelBody>

            {/* --- SECTION 3: SYSTEM SPECIFICATIONS LAYER --- */}
            <PanelBody title={__('How do I add custom features to my Map?', 'bawbab-interactive-maps')} initialOpen={false} style={{ marginTop: '15px' }}>
                <div style={{ padding: '5px 0' }}>
                    <Text variant="caption" display="block" style={{ color: '#667085', marginTop: '4px' }}>
                    {__("Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry' standard dummy text ever since 1966.", 'bawbab-interactive-maps')}
                    </Text>
                </div>
            </PanelBody>
            <div style={{ marginTop: '10px' }}>
                <Text variant="title.small" display="block" style={{ fontWeight: '600', color: '#101828' }}>
                    {__('Bawbab the Company', 'bawbab-interactive-maps')}
                </Text>
                <Text variant="body" display="block" style={{ lineHeight: '1.6', color: '#344054', marginBottom: '15px' }}>
                    {__("Bawbab Technologies is an infrastructure pioneer engineering Africa's first AI-driven scalable Digital Address Infrastructure (DAI) core platform. By translating localized landmarks into machine-readable digital address logistics networks, the platform helps close the continent's substantial $1.2B+ addressability gap.", 'bawbab-interactive-maps')}
                </Text>
                    
                <Flex align="center" gap={3} style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #007cba' }}>
                    <FlexItem><Dashicon icon="admin-site-alt3" size={20} style={{ color: '#007cba' }} /></FlexItem>
                    <FlexItem style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '12px', color: '#1d2939' }}>{__('DAI Location Intelligence', 'bawbab-interactive-maps')}</strong>
                        <span style={{ fontSize: '11px', color: '#475467' }}>
                            {__('Demonstrating capabilities across e-commerce, logistics, Emergency Response (EMR), banking, and government services.', 'bawbab-interactive-maps')}
                        </span>
                    </FlexItem>
                </Flex>
            </div>
            <div style={{ marginTop: '10px' }}>
                <Text variant="title.small" display="block" style={{ fontWeight: '600', color: '#101828' }}>
                    {__('Authors & Contributors', 'bawbab-interactive-maps')}
                </Text>
                {/* Author 1 */}
                <Flex justify="space-between" align="center" style={{ padding: '8px 0', borderBottom: '1px solid #f2f4f7' }}>
                    <Flex gap={2}>
                        <Dashicon icon="businessperson" style={{ color: '#555' }} />
                        <strong>{__('Bawbab Technologies', 'bawbab-interactive-maps')}</strong>
                    </Flex>
                    <ExternalLink href="https://bawbab.com">{__('Visit Website', 'bawbab-interactive-maps')}</ExternalLink>
                </Flex>

                {/* Author 2 */}
                <Flex justify="space-between" align="center" style={{ padding: '8px 0', borderBottom: '1px solid #f2f4f7' }}>
                    <Flex gap={2}>
                        <Dashicon icon="admin-users" style={{ color: '#555' }} />
                        <strong>{__('Marcel Oketch', 'bawbab-interactive-maps')}</strong>
                    </Flex>
                    <ExternalLink href="https://profiles.wordpress.org/marcellus89/">{__('View Profile', 'bawbab-interactive-maps')}</ExternalLink>
                </Flex>

                {/* Author 3 */}
                <Flex justify="space-between" align="center" style={{ padding: '8px 0' }}>
                    <Flex gap={2}>
                        <Dashicon icon="welcome-learn-more" style={{ color: '#555' }} />
                        <strong>{__('Dr. Coretin Sanchez', 'bawbab-interactive-maps')}</strong>
                    </Flex>
                    <ExternalLink href="https://profiles.wordpress.org/corentinsanchez/">{__('View Profile', 'bawbab-interactive-maps')}</ExternalLink>
                </Flex>
            </div>
        </div>
    );
};
