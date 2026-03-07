export const en = {
    common: {
        loading: 'Loading...',
        back: 'Back',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        error: 'Error',
        success: 'Success',
        veritumPro: 'VERITUM PRO',
        backToHome: 'Back to Home',
        privacy: 'Privacy',
        terms: 'Terms',
        security: 'Security & Infrastructure',
        byodb: 'BYODB Architecture & Legal Intelligence.',
        search: 'Global search...',
        switchToLight: 'Switch to light theme',
        switchToDark: 'Switch to dark theme',
        daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        notApplicable: 'N/A',
        user: 'User',
        loadingEcosystem: 'Loading ecosystem...',
        selectLanguage: 'Select Language'
    },
    nav: {
        home: 'Home',
        modules: 'Modules',
        pricing: 'Pricing',
        story: 'Our Story',
        login: 'Login',
        register: 'Start Free',
        dashboard: 'Veritum Panel',
        admin: 'Administration',
        master: 'Master'
    },
    auth: {
        loginTitle: 'Welcome Back',
        registerTitle: 'Create Your Account',
        resetTitle: 'Reset Password',
        loginSubtitle: 'Access your PRO legal ecosystem.',
        registerSubtitle: 'Join the high-performance modular legal ecosystem.',
        resetSubtitle: 'Enter your email to receive reset instructions.',
        emailLabel: 'Email / Login',
        passwordLabel: 'Password',
        confirmPasswordLabel: 'Confirm Password',
        loginButton: 'Enter Ecosystem',
        registerButton: 'Create My Account',
        resetButton: 'Send Instructions',
        googleLogin: 'Login with Google',
        noAccount: "Don't have an account? Sign Up",
        hasAccount: 'Already have an account? Login',
        forgotPassword: 'Forgot password?',
        signUp: 'Sign Up',
        signIn: 'Login',
        backToLogin: 'Back to Login',
        strength: {
            title: 'Password Strength',
            empty: 'Enter a password',
            veryWeak: 'Very Weak',
            weak: 'Weak',
            moderate: 'Moderate',
            strong: 'Strong',
            checks: {
                length: 'Min 6 characters',
                upper: 'Uppercase Letter',
                lower: 'Lowercase Letter',
                number: 'Number',
                symbol: 'Symbol (!@#$)'
            }
        },
        newPasswordPlaceholder: 'New Password',
        confirmNewPasswordPlaceholder: 'Confirm New Password',
        errors: {
            passwordsDoNotMatch: 'Passwords do not match.',
            passwordTooShort: 'Password must be at least 6 characters long.',
            resetError: 'Error resetting password. Please try again.',
            googleError: 'Error signing in with Google.',
            inactive: 'This account is inactive. Please contact your administrator.',
            default: 'An error occurred during authentication.',
            notFound: 'Email not found. Please sign up.',
            genResetSuccess: 'Your temporary password has been sent! Check your email (and spam folder, marking as "not spam" if needed).'
        },
        resetConfirmButton: 'Send Temporary Password',
        alreadyRegistered: 'Email already registered.',
        accountCreated: 'Account created successfully!'
    },
    account: {
        settings: 'Account Settings',
        profile: 'Profile',
        security: 'Security',
        notifications: 'Notifications',
        language: 'Language',
        theme: 'Theme',
        signOut: 'Sign Out'
    },
    modules: {
        title: 'Specialized Modules',
        subtitle: 'Modular architecture designed for the complete legal lifecycle.',
        notInPlan: 'This module is not part of your current plan.',
        acquire: 'Acquire Module',
        learnMore: 'Learn More',
        access: 'Access Module',
        sentinel: {
            title: 'SENTINEL PRO',
            subtitle: 'Strategic Monitoring & Data Intelligence',
            newMonitor: 'New Monitoring',
            metrics: {
                active: 'Active Alerts',
                risks: 'Identified Risks',
                score: 'Reputation Score',
                captures: 'Captures (Month)'
            },
            list: {
                title: 'Monitorings',
                empty: 'No active monitoring.',
                loading: 'Loading...',
                capturing: 'Capturing...'
            },
            table: {
                title: 'Snippets and Publications',
                filterPlaceholder: 'Filter content...',
                headers: {
                    statusIA: 'AI Status',
                    source: 'Source / Term',
                    fragment: 'Content Fragment',
                    date: 'Date',
                    actions: 'Actions'
                },
                empty: 'No captures found.',
                loading: 'Locating records...',
                sentiment: {
                    positive: 'Positive',
                    negative: 'Negative',
                    neutral: 'Neutral'
                },
                scoreIA: 'AI Score: {score}%',
                tooltips: {
                    golden: 'Search Proactive Intelligence (Golden Alert)',
                    analyze: 'Analyze Sentiment with AI',
                    link: 'Link to NEXUS PRO',
                    view: 'View Original',
                    edit: 'Edit'
                }
            },
            modals: {
                link: {
                    title: 'Link to Nexus',
                    subtitle: 'Select the case to attach the snippet.',
                    empty: 'No cases registered in Nexus.',
                    noTitle: 'Untitled Case',
                    cancel: 'Cancel'
                },
                config: {
                    title: 'Configure Monitoring',
                    subtitle: 'Deep search and AI sentiment analysis.',
                    labelTitle: 'Identification / Alias',
                    labelType: 'Monitoring Type',
                    labelTerm: 'Search Term',
                    placeholderTitle: 'Ex: Bank of America Monitoring',
                    placeholderTerm: 'Tax ID, Bar Number or Term...',
                    discard: 'Discard',
                    start: 'Start Tracking',
                    types: {
                        Keyword: 'Keyword',
                        OAB: 'Bar Number (OAB)',
                        CNJ: 'Case Number (CNJ)',
                        Company: 'Business Name / Tax ID',
                        Person: 'Party Name'
                    },
                    footer: 'When activated, Sentinel PRO will process daily indexing in legal portals and social networks, triggering sentiment evaluations via Gemini AI automatically.'
                }
            },
            label: 'Sentinel'
        },
        intelligence: {
            label: 'Intelligence Hub',
            title: 'INTELLIGENCE HUB',
            subtitle: 'Proactive Insights & Legal Opportunities',
            description: 'Strategic insights and proactive legal opportunities. The brain of the ecosystem. Centralize AI processing, connect external APIs, and automate complex workflows across all modules.',
            filters: {
                all: 'All',
                unread: 'New',
                actioned: 'Processed'
            },
            stats: {
                total: 'Total Intelligence',
                alertsMonth: 'Alerts generated this month',
                pending: 'Pending Actions',
                conversion: 'Conversion Rate'
            },
            loading: 'Syncing Intelligence...',
            empty: {
                title: 'No Golden Alerts',
                desc: 'Monitor more terms in Sentinel PRO to generate insights.'
            },
            card: {
                impact: 'Impact',
                detectedVia: 'Detected via',
                noContent: 'No content available',
                reasoning: 'AI Strategic Reasoning',
                thesis: 'Related Thesis',
                internalKnowledge: 'Internal Knowledge',
                capturedAt: 'Captured on',
                createPetition: 'Create Petition',
                validate: 'Validate',
                ignore: 'Ignore',
                newLabel: 'New'
            }
        },
        nexus: {
            label: 'Nexus',
            title: 'NEXUS PRO',
            subtitle: 'Operational Core & Case Management',
            views: {
                kanban: 'Kanban',
                list: 'List'
            },
            newLawsuit: 'New Case',
            newTask: 'Schedule Task',
            metrics: {
                active: 'Active Cases',
                deadlines: '24h Deadlines',
                pending: 'Avg Pending',
                completion: 'Completion Rate'
            },
            kanban: {
                todo: 'To Do',
                doing: 'In Progress',
                done: 'Done',
                late: 'Overdue',
                loading: 'Loading...',
                deleteConfirm: 'Are you sure you want to archive this case? It can be recovered by the administrator.'
            },
            table: {
                headers: {
                    cnj: 'CNJ Number',
                    title: 'Title / Client',
                    status: 'Status',
                    lastMovement: 'Last Movement',
                    actions: 'Actions'
                }
            },
            modals: {
                lawsuit: {
                    title: 'Case Registration',
                    titleEdit: 'Edit Case',
                    subtitle: 'Relational linking for Sentinel PRO automation.',
                    labelCnj: 'Case Number (CNJ - Strict)',
                    placeholderCnj: '0000000-00.0000.0.00.0000',
                    labelTitle: 'Case Title / Identification',
                    placeholderTitle: 'Ex: Collection Action - [Client Name]',
                    labelAuthor: 'Plaintiff (Author)',
                    labelDefendant: 'Defendant',
                    selectCrm: 'Select from CRM...',
                    advancedShow: 'View Advanced Fields',
                    advancedHide: 'Hide Advanced Fields',
                    labelLawyer: 'Responsible Lawyer',
                    selectTeam: 'Select from Team...',
                    labelCourt: 'Court (Tribunal)',
                    placeholderCourt: 'Ex: TRT-2, District Court',
                    labelChamber: 'Chamber / Room',
                    placeholderChamber: 'Ex: 12th Labor Court',
                    labelCity: 'City / District',
                    placeholderCity: 'Ex: New York',
                    labelState: 'State (UF)',
                    placeholderState: 'Ex: NY',
                    labelSphere: 'Sphere',
                    placeholderSphere: 'Ex: Labor',
                    labelRito: 'Procedural Rite',
                    placeholderRito: 'Ex: Summary, Ordinary',
                    labelValue: 'Case Value ($)',
                    placeholderValue: '0.00',
                    cancel: 'Cancel',
                    save: 'Save Case in Nexus',
                    validation: {
                        cnj: 'Invalid CNJ Number! Use the format: 0000000-00.0000.0.00.0000'
                    }
                },
                task: {
                    title: 'Schedule Task',
                    subtitle: 'Strict linking: Team & Cases.',
                    labelTitle: 'Task Title',
                    placeholderTitle: 'Ex: File Initial Petition',
                    labelLawsuit: 'Link to Case (Nexus)',
                    selectLawsuit: 'Select a case...',
                    labelResponsible: 'Responsible (Team)',
                    selectTeam: 'Select from Team...',
                    labelDueDate: 'Deadline (Due Date)',
                    labelPriority: 'Priority',
                    priorities: {
                        Low: 'Low',
                        Medium: 'Medium',
                        High: 'High',
                        Urgent: 'Urgent'
                    },
                    cancel: 'Cancel',
                    save: 'Create Task'
                }
            },
            tabs: {
                people: 'People',
                processes: 'Cases',
                tasks: 'Tasks',
                calendar: 'Calendar',
                assets: 'Assets',
                corporate: 'Corporate'
            },
            empty: {
                processes: 'No processes found.',
                tasks: 'No tasks found.',
                syncing: 'Syncing processes...'
            },
            comingSoon: {
                title: 'Coming Soon to Nexus Pro',
                assetsSubtitle: 'Total control of your assets and procedural guarantees will come here.',
                corporateSubtitle: 'Corporate management and long-term contracts will be centralized here.'
            }
        },
        scriptor: {
            label: 'Scriptor',
            title: 'SCRIPTOR PRO',
            subtitle: 'AI-Augmented Legal Writing',
            description: 'Produce petitions, contracts, and legal opinions in seconds with GenAI trained in a legal context.',
            saving: 'Saving...',
            synced: 'Synced',
            saveError: 'Save Error',
            newDocument: 'New Document',
            nexusContext: 'Nexus Context',
            noProcessLink: 'No case link',
            draftInstruction: 'Draft Instruction',
            draftPlaceholder: 'Describe what you want to write...',
            generateAI: 'Generate via AI',
            library: 'Library',
            docTitlePlaceholder: 'Document Title',
            editorPlaceholder: 'The petition starts here...',
            history: 'History'
        },
        valorem: {
            label: 'Valorem',
            title: 'VALOREM PRO',
            subtitle: 'Financial Controller',
            description: 'Precise fee management and judicial calculations',
            newTransaction: 'New Subaccount',
            masterContext: 'Master Context',
            selectClient: 'Select Client',
            clientPlaceholder: '--- Select a Client ---',
            clientGroup: 'CLIENTS (ADMIN PARTNERS)',
            stats: {
                balance: 'Cash Balance',
                income: 'Revenue (Total)',
                pending: 'Account Receivable',
                expense: 'Expenses'
            },
            chart: {
                title: 'Cash Flow',
                fullReports: 'View Full Reports'
            },
            list: {
                title: 'Recent Entries',
                searchPlaceholder: 'Search transactions...',
                date: 'Date',
                description: 'Entry',
                status: 'Status',
                value: 'Value',
                loading: 'Reconciling data...',
                empty: 'No entries found.'
            },
            sidebar: {
                efficiency: 'Collection Efficiency',
                efficiencyNote: 'Your collection rate is above the market average (85%). Keep it up!',
                categoryDivision: 'Division by Category',
                categories: {
                    fees: 'Fees',
                    operational: 'Operational',
                    costs: 'Costs'
                }
            },
            drawer: {
                title: 'New Subaccount',
                subtitle: 'Financial Intelligence Management',
                income: 'Income',
                expense: 'Expense',
                labelDescription: 'Description / Title',
                placeholderDescription: 'Ex: Fees - Case 001/24',
                labelAmount: 'Value (BRL)',
                labelStatus: 'Status',
                labelLawsuit: 'Nexus Process',
                placeholderLawsuit: 'Not linked to a process',
                labelPerson: 'Person / Client',
                placeholderPerson: 'Not linked to a person',
                save: 'Process Subaccount',
                statuses: {
                    pending: 'Pending Payment',
                    paid: 'Cleared / Paid',
                    canceled: 'Canceled / Reversed'
                }
            }
        },
        cognitio: {
            label: 'Cognitio',
            title: 'COGNITIO PRO',
            subtitle: 'Legal Intelligence & Knowledge Base',
            description: 'Fact-based decisions, not intuition. Analyze judicial trends, judge profiles, and success probabilities with structured data.',
            newArticle: 'New Thesis / Article',
            predictionEngine: {
                title: 'Predictive Analysis Engine',
                header: 'Anticipate the case outcome with precision.',
                placeholder: 'Ex: Civil Court of New York, Judge Robert Smith, Child Support...',
                button: 'Generate AI Prediction',
                result: 'Estimated Outcome',
                chanceLabel: 'chance',
                waiting: 'Waiting for input data...',
                judgeHistory: 'Judge History'
            },
            library: {
                title: 'Thesis & Jurisprudence Library',
                items: 'Items',
                searchPlaceholder: 'Search by term or keywords...',
                empty: 'No thesis found',
                readFull: 'Read Full',
                author: 'Veritum Team'
            },
            modal: {
                title: 'Knowledge Management',
                subtitle: 'Register new theses, jurisprudence, and study notes.',
                labelTitle: 'Thesis / Article Title',
                placeholderTitle: 'Clear and objective title...',
                labelCategory: 'Legal Category',
                placeholderCategory: 'Ex: Civil Law',
                labelTags: 'Tags (comma separated)',
                placeholderTags: 'Supreme Court, Appeal, Civil...',
                labelContent: 'Legal Content',
                placeholderContent: 'Develop the legal reasoning here...',
                discard: 'Discard',
                save: 'Save Knowledge'
            }
        },
        vox: {
            label: 'Vox Clientis',
            title: 'VOX CLIENTIS PRO',
            subtitle: 'Customer Experience & Legal CRM',
            description: 'Raise the bar for service. Client portal, automated communication workflows, and relationship management for loyalty and transparency.',
            syncing: 'Syncing chats...',
            waiting: 'Waiting for interaction...',
            activePortal: 'Active Portal',
            nexusLink: 'Nexus Link',
            emptyMessages: 'No messages yet',
            emptyPrompt: 'Start the service by clicking below.',
            translating: 'Translating...',
            voxLegal: 'VOX LEGAL (AI)',
            voxLegalNote: 'Vox Legal simplifies legalese for the client.',
            placeholder: 'Write your operational or legal message...'
        },
    },
    pricing: {
        title: 'Plans that keep up with your growth.',
        subtitle: 'We don\'t just sell software, we deliver the exact architecture for your moment in law.',
        cancelGuarantee: 'Veritum PRO has no setup fees, no lock-in contracts, and no fine print. You stay because you found peace of mind to practice law, not because you are tied to us. Choose your plan, cancel whenever you want.',
        compare: 'Compare Plans and Values',
        plans: {
            start: {
                title: 'START',
                desc: 'For solo lawyers and new firms that need to organize and stop missing deadlines.'
            },
            growth: {
                title: 'GROWTH',
                desc: 'For growing firms that require task automation and Artificial Intelligence to gain scale.',
                badge: 'Most Popular'
            },
            strategy: {
                title: 'STRATEGY',
                desc: 'For corporate legal departments making decisions based on Jurimetrics and deep data.',
                badge: 'Enterprise'
            }
        }
    },
    dashboard: {
        accessModule: 'Access Module',
        acquireModule: 'Acquire Module',
        moduleLocked: 'This module is not included in your current plan.',
        welcome: 'Welcome to',
        veritumPro: 'Veritum Pro',
        intro: 'Select an area to start exploring the modular legal ecosystem.',
        suiteTitle: 'Modules Dashboard',
        suiteSubtitle: 'Access the tools of the Veritum Pro ecosystem.',
        adminTitle: 'Administration Management',
        adminSubtitle: 'Access control and ecosystem settings.',
        masterTitle: 'Master Panel',
        masterSubtitle: 'Structural settings of modules and commercial plans.',
        myPlan: 'My Plan',
        vipPoints: '{count} Points',
        activateNow: 'Activate Now',
        activeProgram: 'Active Program',
        groups: {
            modules: {
                title: 'Modules',
                desc: 'Access the intelligent tools of the Veritum Pro ecosystem.'
            },
            admin: {
                title: 'Administration',
                desc: 'Manage users, permissions, and system settings.'
            },
            master: {
                title: 'Master',
                desc: 'Infrastructure, modules, and commercial plans settings.'
            }
        },
        search: 'Global search...',
        accessFunc: 'Access the features of the {name} module.',
        adminUserDesc: 'Manage user hierarchy, access permissions, and roles control (Master/Admin/Operator).',
        adminSettingsDesc: 'Adjust global system preferences, integrations, and interface parameters.',
        masterSuitesDesc: 'Structural configuration of modules, API keys, and ecosystem availability.',
        masterPlansDesc: 'Creation and editing of commercial plans, prices, discounts, and permissions linking.',
        masterSchedDesc: 'Lead management, VIP demo scheduling, and sales calendar.',
        masterEmailDesc: 'Configuration of SMTP aliases (FROM) by department and location (JSONB).',
        masterGenericDesc: 'Structural adjustments of {name}.'
    },
    hero: {
        title: 'Veritum PRO',
        titleAccent: '\nThe truth about your office,\nthe control over your future.',
        subtitle: 'A complete BYODB (Bring Your Own Database) architecture for high-performance law firms. Your data, your infrastructure, our intelligent modules.',
        ctaPrimary: 'Get Started',
        ctaSecondary: 'View plans and pricing',
    },
    storyPage: {
        nav: {
            home: 'Home',
            purpose: 'Purpose',
            birth: 'Birth',
            meaning: 'Meaning',
            peace: 'Peace of Mind'
        },
        title: 'The Search for Clarity.',
        subtitle: 'The Quest for Truth.',
        purpose: 'The Purpose',
        pain: {
            title: 'The Pain That Moved Us',
            content1: 'We know that modern law has become a sea of chaos. Between complex judicial systems, endless spreadsheets, and the constant fear of missing a fatal deadline, the lawyer lost their most precious asset: the time to think strategically and quality of life.',
            content2: 'The market was full of software, but most seemed to have been designed to hinder, not help. We felt that legal technology needed less bureaucracy and more humanity.'
        },
        birth: {
            title: 'The Birth of an Ecosystem',
            content: 'From this frustration, our ecosystem was born. We didn\'t want to create just "another management system." We wanted to build a silent partner, an invisible intelligence working behind the scenes so that law firms could focus on what really matters: justice and their clients.'
        },
        meaning: {
            title: 'The Meaning of Veritum',
            content: 'When we named our platform, we didn\'t want a word that meant just "correct data." We wanted something that went beyond numbers and looked at people.',
            veritas: {
                title: 'Veritas',
                subtitle: 'Abstract Truth',
                desc: 'The general concept of justice you defend. The ideal.'
            },
            verum: {
                title: 'Verum',
                subtitle: 'Cold Fact',
                desc: 'Objective proof, the document attached to the case. Raw data.'
            },
            veritum: {
                title: 'Veritum',
                subtitle: 'Felt Truth',
                desc: 'Experienced reality. The psychological aspect of peace of mind.',
                specialTag: 'The Veritum Choice'
            }
        },
        deepDive: {
            peaceTitle: 'PEACE',
            peaceSubtitle: 'Psychological',
            content1: 'And in Law, where truth often remains hidden under piles of documents and deadlines, delivering Veritum means delivering peace of mind.',
            content2: 'It is the psychological tranquility of knowing that no deadline will be missed. Veritum PRO exists to bring clarity to the surface: it illuminates your office, transforming procedural chaos into visual control, raw data into exact jurimetrics, and repetitive tasks into intelligent automation.',
            quote: 'We simplify technology so you feel the true freedom to practice law and can elevate your performance to the maximum.'
        },
        cta: {
            title: 'Veritum PRO - The truth about your office, control over your future.'
        },
        footer: 'Veritum PRO - The truth about your office, control over your future.'
    },
    userMenu: {
        profile: 'My Profile',
        logout: 'Sign out of Ecosystem',
        profileBreadcrumb: 'Profile'
    },
    staticPages: {
        privacy: {
            title: 'Privacy Policy',
            updatedAt: 'Last updated: February 24, 2024',
            intro: 'Your privacy is of utmost importance to Veritum PRO. This policy describes how we collect, use, and protect your information when using our BYODB architecture integrated with Supabase.',
            section1Title: '1. BYODB Architecture (Bring Your Own Database)',
            section1Content: 'Veritum PRO operates under a model where you provide your own data infrastructure. API credentials (Supabase/Gemini) are stored locally on your device or in secure tables under your control. We do not have access to your client data or legal cases.',
            section2Title: '2. Information Collection',
            section2Content: 'We collect only essential data for authentication (Email/Name) via Supabase Auth and interface preferences (Theme/Language). Content processed by modules (Nexus, Sentinel) resides exclusively in your database instance.',
            section3Title: '3. Artificial Intelligence',
            section3Content: 'We use Google Gemini AI for legal processing. Data sent for analysis is processed according to Google API privacy policies, and no sensitive information is used for global model training on our part.'
        },
        terms: {
            title: 'Terms of Service',
            updatedAt: 'Last updated: February 24, 2024',
            intro: 'By accessing the Veritum PRO ecosystem, you agree to comply with these terms of service, all applicable laws and regulations.',
            section1Title: '1. License to Use',
            section1Content: 'Veritum PRO grants a limited, non-exclusive, and revocable license to use the modular software according to the contracted plan. Reverse engineering or redistribution of proprietary modules is prohibited.'
        }
    },
    management: {
        accessGroups: {
            title: 'Access Groups',
            subtitle: 'Granular Refinement: Define permissions by functionality.'
        },
        users: {
            title: 'User Management',
            subtitle: 'Manage who accesses your ecosystem.',
            searchPlaceholder: 'Name or email...',
            searchLabel: 'Search Member',
            roleLabel: 'Role/Level',
            statusLabel: 'Status',
            newUser: 'New User',
            allPlans: 'All Plans',
            allRoles: 'All',
            active: 'Active',
            inactive: 'Inactive',
            filterByAdmin: 'Filter by Administrator',
            allAdmins: 'All Administrators',
            masterFilter: {
                self: 'Master (My Users)',
                clients: 'Private Partner-Administrators',
                selectClient: 'Select a Client'
            },
            tabs: {
                team: 'Team Members',
                users: 'System Users'
            },
            table: {
                member: 'Member',
                accessGroup: 'Access Group',
                role: 'Role',
                status: 'Status',
                controls: 'Controls',
                noGroup: 'No Group',
                syncing: 'Syncing Ecosystem...',
                noUser: 'No members found.',
                readOnly: 'Read Only',
                page: 'Page {current} of {total}',
                tooltips: {
                    toggleStatus: 'Toggle Status',
                    edit: 'Edit',
                    delete: 'Delete'
                }
            },
            roles: {
                master: 'Master',
                admin: 'Administrator',
                operator: 'Operator',
                intern: 'Intern',
                partnerAdmin: 'Partner-Administrator',
                partnerAdministrative: 'Partner-Administrative',
                senior: 'Senior',
                coordinator: 'Coordinator',
                paralegal: 'Paralegal',
                financial: 'Financial',
            },
            modal: {
                addTitle: 'New Member',
                editTitle: 'Update Data',
                subtitle: 'Configure credentials and access level.',
                name: 'Full Name',
                email: 'Email / Login',
                password: 'Initial Password',
                passwordEdit: 'Change Password (Optional)',
                role: 'Role / Corporate Function',
                selectRole: 'Select a Role...',
                inherited: 'Permissions inherited from Group: {name}',
                close: 'Close',
                submitAdd: 'Finish Registration',
                submitEdit: 'Save Edition',
                roleRestriction: 'Only administrators can change roles and permissions.',
                globalSystem: 'Global System',
                godMode: 'Super Master (God Mode)'
            },
            delete: {
                title: 'Delete Member?',
                message: 'Are you sure you want to delete "{name}"? This action is irreversible.',
                confirm: 'Yes, Delete',
                cancel: 'No, Cancel'
            },
            bulk: {
                selected: '{count} selected',
                activate: 'Activate Selected',
                deactivate: 'Deactivate Selected',
                delete: 'Permanently Delete',
                confirmDelete: 'Are you sure you want to delete {count} users? This action is irreversible.'
            },
            toast: {
                bulkStatusSuccess: '{count} users marked as {status}!',
                bulkDeleteSuccess: '{count} users removed from the ecosystem!',
                bulkError: 'Error processing bulk actions.',
                superAdminOnly: 'Access denied: Requires Partner-Administrator level.',
                operatorRestriction: 'Restriction: Operators cannot create Administrators.',
                selfEditOnly: 'You can only edit your own profile.',
                successEdit: 'Data updated successfully!',
                successAdd: 'Member registered in the ecosystem!',
                statusSuccess: 'User is now {status}.',
                successDelete: 'Member removed permanently.',
                deleteError: 'Failed to remove member.',
                errorProcess: 'Error processing request.',
                unauthorized: 'Unauthorized action.'
            },
            menu: 'User Management'
        },
        access: {
            title: 'Access Groups',
            subtitle: 'Granular Refinement: Define permissions by functionality.',
            menu: 'Access Groups',
            newGroup: 'New Group',
            masterGroups: 'Master (My Groups)',
            privateAdmins: 'Private Partner-Administrators',
            noRoles: 'No roles found. Create a new one first.',
            created: 'Created on {date}',
            noAccess: 'No active access',
            syncing: 'Syncing Ecosystem...',
            noGroups: 'No access group created.',
            table: {
                group: 'Access Group',
                members: 'Members',
                features: 'Features',
                controls: 'Controls',
                noMembers: 'No Members',
                memberCount: '{count} Members',
                featureCount: '{count} Features',
            },
            modal: {
                addTitle: 'New RBAC Group',
                editTitle: 'Configure Permissions',
                subtitle: 'Activate specific features for this profile.',
                translateIA: 'Translate via AI',
                translating: 'Translating...',
                groupName: 'Group Identification',
                groupNamePlaceholder: 'Ex: Triage Team, Controller, Partners...',
                templateLabel: 'Use Template (Quick Access)',
                templatePlaceholder: 'Select a template for quick filling...',
                clearSelection: 'Clear Selection',
                clearSelectionSuccess: 'Permissions cleared.',
                linkedRoles: 'Linked Roles',
                newRole: 'New Role',
                rolesPlaceholder: 'Select roles or create new ones...',
                others: 'Other Roles / Miscellaneous',
                granularTitle: 'Granular Permissions by Suite',
                featuresActive: '{count} of {total} Active',
                toggleAll: 'Toggle All',
                planRestriction: 'Current plan does not have access to this feature.',
                save: 'Save Group and Permissions',
                close: 'Close',
                tabs: {
                    identification: 'Identification',
                    permissions: 'Permissions'
                }
            },
            roleModal: {
                addTitle: 'New Role',
                editTitle: 'Edit Role',
                subtitle: 'Define the role name',
                namePlaceholder: 'e.g., Senior Lawyer',
                save: 'Save Role'
            },
            delete: {
                title: 'Delete?',
                message: 'Remove group {name}? Linked users will lose granular access.',
                confirm: 'Yes, Remove Group',
                cancel: 'Cancel',
                error: 'Error removing: {error}'
            },
            toast: {
                duplicate: 'A group with the name "{name}" already exists',
                successName: 'Group name updated.',
                successSave: 'Group and permissions updated!',
                successCreate: 'Group created successfully!',
                errorSave: 'An error occurred while saving the group.',
                fillName: 'Fill in the group name in pt-br to perform translation.',
                successTranslate: 'AI translation completed!',
                errorTranslate: 'Translation error: check your Gemini API Key.',
                duplicateRole: 'The role "{name}" already exists.',
                successRoleAdd: 'Role created successfully.',
                successRoleEdit: 'Role updated.',
                errorRole: 'Error saving role.',
                applyTemplateSuccess: 'Template "{name}" applied!',
                applyTemplateWithPremium: 'Template "{name}" applied! (Premium resources ignored)',
                loadModulesError: 'Error loading system modules.',
                loadFeaturesError: 'Error loading features.'
            }
        },
        settings: {
            title: 'Settings',
            menu: 'Settings',
            subtitle: 'Global workspace adjustments.',
            tabs: {
                infra: 'Infrastructure',
                org: 'Office Data',
                plan: 'My Subscription',
                vip: 'VIP Club',
                cancel: 'Cancel Subscription'
            },
            infra: {
                title: 'Connectivity Gateway',
                subtitle: 'Enterprise Settings & BYODB',
                syncData: 'Private Data Synchronization',
                save: 'Save Infra',
                urlLabel: 'Custom Supabase URL',
                keyLabel: 'Custom Supabase Key',
                geminiLabel: 'Custom Gemini Key',
                urlPlaceholder: 'https://your-project.supabase.co',
                keyPlaceholder: 'Anon/Public Key...',
                geminiPlaceholder: 'AIzaSyB...',
                privacyTitle: 'Guaranteed Privacy',
                privacyDesc: 'By using BYODB, your client data, processes and billing never leave your own Supabase server.',
                restricted: 'Access restricted to Partner-Administrators.',
                deleteConfig: 'Delete Settings',
                deleteConfirmTitle: 'Delete?',
                deleteConfirmMessage: 'This will remove your custom keys and return to the system default. Are you sure?',
                loading: 'Loading Infra Ecosystem...',
                providerLabel: 'Database Provider',
                saving: 'Saving...'
            },
            vip: {
                title: 'Veritum VIP Club',
                panelTitle: 'Ambassador Dashboard',
                panelSubtitle: 'Active Benefits',
                intro1: 'You are part of the high-performance law firms group.',
                intro2: 'Activate your VIP profile for free to claim your exclusive mailbox (@veritumpro.com) and generate your ambassador link. For each colleague who subscribes to the platform through your link, you earn VIP Points (1 Point = 1% OFF). Accumulate 100 points to zero out your subscription and save excess balances for the following months.',
                activateBtn: 'Activate VIP Benefits',
                successActivate: 'VIP Club Activated Successfully!',
                copySuccess: 'Link copied to clipboard!',
                accessTitle: 'Your Accesses',
                mailboxActive: 'Your VIP mailbox is active! Access at:',
                accessWebmail: 'Access Webmail',
                mailboxRestricted: 'The @veritumpro.com custom mailbox is an exclusive benefit for Growth or Strategy plan subscribers (Semi-annual or Annual).',
                planBlocked: 'Blocked in your Plan',
                referralTitle: 'Your Referral Link',
                referralDesc: 'Share the link below with your professional colleagues or ask them to enter your code at checkout.',
                referralTip: 'Invitations that result in Annual subscriptions multiply your points quickly!',
                yourCode: 'Your Code:',
                discountDashboard: 'Discount Dashboard',
                goal: 'Your Goal: 100 VIP Points (Zero Subscription)',
                pointsTarget: '100 Points',
                offReached: '100% OFF REACHED 🎉',
                pointsCycle: 'Points In This Cycle',
                discountRenewal: 'Renewal Discount',
                extraBalance: 'Extra Balance (Next Cycle)',
                referralExtract: 'Referral Statement',
                extractDesc: 'See where your points came from',
                noReferrals: 'No confirmed referrals yet.',
                confirmed: 'Confirmed',
                pending: 'Pending',
                points: 'Points',
                updateDetected: 'VIP Club: Update detected!',
                pointsUpdated: 'Your VIP Points have been updated!'
            },
            toast: {
                saveSuccess: 'Infrastructure settings saved!',
                saveError: 'Error saving settings.'
            },
            plan: {
                restrictedSub: 'Access restricted to Partner-Administrators.',
                restrictedDesc: 'Only administrators responsible for the organization (Partner-Administrator) can view details or manage the ecosystem subscription.',
                loading: 'Loading subscription details...',
                syncing: 'Syncing Ecosystem...',
                currentPlan: 'Current Plan',
                planAccess: 'Full access to the ecosystem enabled in your plan.',
                upgrade: 'Upgrade Plan',
                ecosystemModules: 'Ecosystem Modules',
                statusUnlocked: 'Unlocked',
                statusPartial: 'Partial Access',
                statusLocked: 'Locked',
                acquire: 'Acquire',
                features: 'Features',
                commercialPlans: 'Commercial Plans',
                ecosystemCombo: 'Ecosystem Combo',
                individualModule: 'Individual Module',
                recommended: 'Recommended',
                perMonth: '/month',
                perYear: '/year',
                monthly: 'Monthly',
                quarterly: 'Quarterly',
                semiannual: 'Semi-annual',
                yearly: 'Annual',
                liberated: 'Liberated',
                current: 'Current',
                acquirePlan: 'Acquire Plan',
                aLaCarteModules: 'A La Carte Modules',
                acquireModule: 'Acquire Module',
                cancelSubscription: 'Cancel Subscription',
                cancelTitle: 'Do you really want to cancel your subscription?',
                cancelSubtitle: 'We are sorry to see you go. Please tell us why you are canceling so we can improve.',
                cancelReasonLabel: 'Reason for cancellation',
                cancelReasonOption1: 'Price too high',
                cancelReasonOption2: 'Difficulty of use',
                cancelReasonOption3: 'Lack of necessary features',
                cancelReasonOption4: 'Migrating to another software',
                cancelReasonOption5: 'Other reason',
                cancelFeedbackPlaceholder: 'Tell us a little more about the reason for cancellation and how we can improve our service...',
                cancelButton: 'Confirm Cancellation',
                keepPlan: 'Keep Plan',
                cancelConfirmTitle: 'Are you absolutely sure?',
                cancelConfirmMessage: 'Your subscription will be canceled at the end of the current period. You will lose access to premium features.',
                cancelSuccess: 'Your subscription has been successfully canceled.',
                cancelError: 'An error occurred while canceling your subscription. Please contact support.',
                secureOperation: 'Secure Operation via Veritum PRO Cloud'
            }
        },
        organization: {
            identification: 'Identification',
            companyName: 'Company Name',
            companyNamePlaceholder: 'Official Company Name',
            tradingName: 'Trading Name',
            tradingNamePlaceholder: 'Brand Name',
            cnpj: 'CNPJ',
            logo: 'Logo & Brands',
            logoTitle: 'Office Logo',
            logoDesc: 'Will be used in document headers and reports.',
            email: 'Commercial Email',
            emailPlaceholder: 'contact@firm.com',
            phone: 'Phone',
            website: 'Website',
            address: 'Headquarters Address',
            zip: 'ZIP (Automatic Search)',
            street: 'Street/Ave',
            number: 'Number',
            complement: 'Complement',
            neighborhood: 'Neighborhood',
            city: 'City',
            state: 'State',
            save: 'Save Office',
            toast: {
                fetchError: 'Error loading office data.',
                cepError: 'ZIP not found.',
                cepFetchError: 'Error searching ZIP.',
                saveSuccess: 'Office data saved successfully!',
                saveError: 'Error saving data.'
            }
        },
        master: {
            fintech: { menu: 'Fintech Management' },
            cloud: { menu: 'Cloud / Add-Ons Management' },
            vip: { menu: 'VIP Club Management' },
            translate: {
                success: 'Success!',
                error: 'Error setting translation'
            },
            suites: {
                menu: 'Module Management',
                title: 'Module Management',
                subtitle: 'Configure the showcase of your legal ecosystem.',
                listTitle: 'Module Listing',
                table: {
                    order: 'Order',
                    module: 'Module',
                    actions: 'Actions',
                    visible: 'Visible Module',
                    hidden: 'Hidden Module',
                    noActive: 'No active modules'
                },
                form: {
                    edit: 'Edit Module',
                    add: 'New Module',
                    metadata: 'Ecosystem Metadata',
                    saveChanges: 'Save Changes',
                    cancelSelection: 'Cancel Selection',
                    publish: 'Publish Module',
                    idKey: 'Identification Key',
                    mainName: 'Main Name',
                    translateIA: 'Translate via AI',
                    translating: 'Translating...',
                    shortBio: 'Short Bio',
                    cardDetails: 'Card Details',
                    features: 'Features / Resources',
                    iconSvg: 'Icon SVG Code',
                    activePortal: 'Active on Portal'
                },
                delete: {
                    title: 'Confirm Deletion',
                    message: 'You are about to permanently remove the module "{name}" from the ecosystem. This action cannot be undone.',
                    cancel: 'Cancel',
                    confirm: 'Yes, Delete'
                },
                toast: {
                    successUpdate: 'Module updated successfully!',
                    successCreate: 'Module created successfully!',
                    errorSave: 'Error saving module',
                    errorStatus: 'Error changing status: {error}',
                    errorDelete: 'Error deleting: {error}',
                    fillBio: 'Fill in at least the Short Bio to translate.',
                    noGemini: 'Gemini Key not configured. Please add your API Key in Settings.',
                    successTranslate: 'AI-based translation completed!',
                    errorTranslate: 'Translation error: {error}'
                }
            },
            plans: {
                menu: 'Plan Management',
                title: 'Plan Management',
                subtitle: 'Configure the packages and prices of Veritum Pro.',
                filters: {
                    all: 'All',
                    individual: 'Individual',
                    combo: 'Combos'
                },
                listTitle: 'Listing',
                table: {
                    order: 'Order',
                    plan: 'Plan',
                    action: 'Action',
                    active: 'Active Plan',
                    inactive: 'Inactive Plan'
                },
                form: {
                    edit: 'Editing:',
                    noName: 'No Name',
                    add: 'New Plan',
                    tabs: {
                        details: 'Details',
                        permissions: 'Permissions'
                    },
                    saveChanges: 'Save Changes',
                    cancelSelection: 'Cancel Selection',
                    create: 'Create Plan',
                    name: 'Plan Name',
                    shortDesc: 'Short Description',
                    shortDescPlaceholder: 'Brief slogan or differentiator of the plan...',
                    translateIA: 'Translate via Gemini AI',
                    monthlyPrice: 'Base Monthly Price ($)',
                    discount: 'Monthly %',
                    quarterlyDiscount: 'Quarterly %',
                    semiannualDiscount: 'Semi-Annual %',
                    yearlyDiscount: 'Annual %',
                    basicFeatures: 'Basic Features (Bullet Points)',
                    featuresPlaceholder: 'One feature per line...',
                    recommended: 'Recommended Plan',
                    activeSale: 'Active for Sale',
                    comboPlan: 'Combo Plan',
                    granularTitle: 'Granular Access Control',
                    granularDesc: 'Select which suites and specific features will be released in this plan.',
                    tooltips: {
                        uncheckAll: 'Click to uncheck all',
                        originalData: 'Original Data (Click to check all)',
                        empty: 'Empty (Click to restore originals)',
                        partial: 'Partial Selection (Click to check all)'
                    }
                },
                delete: {
                    title: 'Delete Plan?',
                    message: 'You will remove "{name}" from selection choices.',
                    no: 'No',
                    confirm: 'Yes, Delete'
                },
                toast: {
                    errorProcess: 'Failed to save plan (data not returned)',
                    successUpdate: 'Plan and permissions updated!',
                    successCreate: 'Plan created successfully!',
                    errorSave: 'Error saving plan',
                    statusSuccess: 'Plan {status} successfully!',
                    errorStatus: 'Error changing status: {error}',
                    errorDelete: 'Error deleting: {error}',
                    fillBio: 'Fill in the Short Bio to translate.',
                    successTranslate: 'AI-based translation completed!',
                    errorTranslate: 'Translation error: {error}'
                }
            },
            scheduling: {
                menu: 'Scheduling',
                title: 'Scheduling',
                titleHighlight: 'Management',
                subtitle: 'View and organize requested strategic demonstrations.',
                views: {
                    month: 'Monthly',
                    day: 'Daily'
                },
                sidebar: {
                    title: 'Requests',
                    empty: 'Nothing found',
                    filterTitle: 'Filter Period',
                    status: {
                        all: 'All',
                        pending: 'Pend',
                        scheduled: 'Sched',
                        attended: 'Atten',
                        canceled: 'Canc'
                    }
                },
                calendar: {
                    today: 'Today',
                    monthFormat: 'MMMM yyyy',
                    dayFormat: 'EEEE, dd MMMM',
                    filters: {
                        all: 'View All',
                        scheduled: 'Scheduled',
                        attended: 'Attended',
                        canceled: 'Canceled'
                    },
                    tooltips: {
                        selectTime: 'Select time for {name}',
                        scheduleAt: 'Schedule at {time}'
                    }
                },
                actions: {
                    sendInvite: 'Send Invitation Email',
                    edit: 'Edit Scheduling',
                    markAttended: 'Mark as Attended',
                    backPending: 'Back to Pending',
                    attended: 'Attended',
                    reschedule: 'Reschedule',
                    cancel: 'Cancel',
                    delete: 'Delete'
                },
                delete: {
                    title: 'Confirm Deletion',
                    message: 'Are you sure you want to delete the scheduling for "{name}"? This action cannot be undone.',
                    cancel: 'Cancel',
                    confirm: 'Delete Lead'
                },
                scheduleConfirm: {
                    title: 'Confirm Scheduling?',
                    message: 'You are confirming the demonstration for:',
                    scheduledFor: 'Scheduled for',
                    at: 'at',
                    no: 'No, Go Back',
                    yes: 'Yes, Confirm',
                    saving: 'Saving...'
                },
                editModal: {
                    title: 'Edit Scheduling',
                    leadLabel: 'Lead: {name}',
                    fields: {
                        name: 'Full Name',
                        email: 'Email',
                        whatsapp: 'WhatsApp',
                        teamSize: 'Team Size',
                        meetingLink: 'Meeting Link (Zoom, Teams, etc)',
                        meetingPlaceholder: 'https://zoom.us/j/...'
                    },
                    actions: {
                        cancel: 'Cancel',
                        sending: 'Sending...',
                        sendInvite: 'Send Invite',
                        save: 'Save Changes'
                    }
                },
                toast: {
                    successConfirm: 'Scheduling confirmed!',
                    errorConfirm: 'Error confirming scheduling.',
                    errorTechnical: 'Technical failure in scheduling.',
                    successDelete: 'Scheduling permanently deleted.',
                    errorDelete: 'Error deleting scheduling.',
                    successUpdate: 'Scheduling updated successfully!',
                    errorSave: 'Error saving changes.',
                    missingLink: 'Please provide the meeting link before sending the invitation.',
                    missingDate: 'This request does not have a scheduled date.',
                    emailSubject: 'Meeting Confirmation - Veritum PRO',
                    emailSuccess: 'Invitation sent to {email}!',
                    emailError: 'Sending failure: {error}',
                    unexpectedError: 'Unexpected error sending email.'
                },
                email: {
                    title: 'Your meeting is confirmed!',
                    greeting: 'Hello',
                    subtitle: 'We have prepared everything for your exclusive demonstration.',
                    scheduledFor: 'SCHEDULED FOR',
                    accessRoom: 'ACCESS VIRTUAL ROOM',
                    calendarReminder: 'Reminder on your calendar:',
                    footerReason: 'You received this email due to your interest in Veritum PRO.',
                    footerSlogan: 'Elevated Legal Performance.'
                }
            },
            email: {
                menu: 'Email Management',
                title: 'Email Management',
                subtitle: 'Configure aliases (FROM) grouped by scenario (JSONB).',
                scenarios: {
                    general: 'General Questions & Partnerships',
                    sales: 'VIP Sales & Scheduling',
                    billing: 'Subscription & Financial Management',
                    support: 'Technical Help & Support'
                },
                card: {
                    description: 'Translations and emails',
                    save: 'Save',
                    email: 'Email',
                    name: 'Name'
                },
                langs: {
                    pt: 'Portuguese (BR)',
                    en: 'English (US)'
                },
                toasts: {
                    loadError: 'Error loading email settings',
                    saveSuccess: 'Configuration updated successfully',
                    saveError: 'Error saving configuration'
                }
            },
            team: {
                menu: 'Team Management',
                title: 'Team Management',
                subtitle: 'Manage your workspace members and their respective permissions.',
                addMember: 'Add Member',
                searchPlaceholder: 'Search by name, email or OAB...',
                stats: {
                    total: 'Total Workspace',
                    active: 'Active Collaborators'
                },
                table: {
                    member: 'Member',
                    role: 'Role / ID',
                    contact: 'Contact',
                    status: 'Status',
                    actions: 'Actions',
                    loading: 'Loading members...',
                    empty: 'No members found.'
                },
                status: {
                    active: 'Active',
                    inactive: 'Inactive'
                },
                tooltips: {
                    edit: 'Edit Member',
                    access: 'Access Settings'
                },
                modal: {
                    titles: {
                        edit: 'Edit Member',
                        new: 'New Team Member'
                    },
                    fields: {
                        name: 'Full Name',
                        namePlaceholder: 'Ex: John Doe',
                        email: 'Corporate Email',
                        emailPlaceholder: 'email@company.com',
                        phone: 'Mobile / Whats',
                        phonePlaceholder: '(11) 99999-9999',
                        oab: 'OAB Number',
                        oabPlaceholder: 'SP123456',
                        role: 'Role / Function',
                        rolePlaceholder: 'Select a role...'
                    },
                    roles: {
                        socio: 'Partner-Administrator',
                        advogado: 'Associate Attorney',
                        estagiario: 'Intern',
                        paralegal: 'Paralegal',
                        financeiro: 'Financial / Admin'
                    },
                    actions: {
                        cancel: 'Cancel',
                        update: 'Update Member',
                        create: 'Create Member'
                    }
                },
                toasts: {
                    fetchError: 'Error loading members',
                    saveError: 'Error saving member',
                    statusError: 'Error changing status'
                }
            },
            persons: {
                menu: 'Client CRM',
                title: 'CRM - Clients and Persons',
                subtitle: 'Central repository of structured data for processes and AI.',
                newEntry: 'New CRM Entry',
                searchPlaceholder: 'Search by name or CPF/CNPJ...',
                stats: {
                    label: 'CRM Database',
                    activeLawsuits: 'Active Lawsuits'
                },
                table: {
                    member: 'Member',
                    classification: 'Classification',
                    contact: 'Contact',
                    actions: 'Actions',
                    loading: 'Loading CRM...',
                    empty: 'No persons registered.'
                },
                types: {
                    Cliente: 'Client',
                    Reclamado: 'Defendant',
                    Testemunha: 'Witness',
                    Preposto: 'Corporate Representative',
                    'Advogado Adverso': 'Opposing Counsel'
                },
                modal: {
                    titles: {
                        edit: 'Edit Entry',
                        new: 'New CRM Entry'
                    },
                    sections: {
                        classification: 'Classification Type',
                        advanced: 'See Advanced Details (RG, Address, History)',
                        hideAdvanced: 'Hide Advanced Fields'
                    },
                    fields: {
                        name: 'Full Name / Business Name',
                        namePlaceholder: 'Ex: Pedro de Alcântara or Company Ltd',
                        document: 'CPF / CNPJ (Numbers Only)',
                        documentPlaceholder: '000.000.000-00',
                        phone: 'WhatsApp / Phone',
                        phonePlaceholder: '+55 (11) 9...',
                        email: 'Primary Email',
                        emailPlaceholder: 'contact@client.com',
                        rg: 'RG',
                        cep: 'ZIP Code (Auto-Search)',
                        street: 'Street / Address',
                        number: 'Number',
                        complement: 'Complement',
                        neighborhood: 'Neighborhood',
                        city: 'City',
                        state: 'State',
                        maritalStatus: 'Marital Status',
                        profession: 'Profession',
                        ctps: 'Labor ID (CTPS)',
                        pis: 'Social Security ID (PIS)',
                        history: 'History of Roles / Notes',
                        historyPlaceholder: 'Relevant details for labor/civil processes...'
                    },
                    actions: {
                        cancel: 'Cancel',
                        update: 'Update Record',
                        save: 'Save to CRM',
                        whatsapp: 'WhatsApp',
                        maps: 'Location',
                        email: 'Email',
                        newLawsuit: 'New Lawsuit',
                        generateDocs: 'Generate Documents',
                        viewLawsuits: 'View Lawsuits'
                    }
                },
                validations: {
                    invalidDocument: 'Invalid Document Format! Use 000.000.000-00 or 00.000.000/0000-00'
                },
                confirmations: {
                    softDelete: 'Are you sure you want to hide this registration? The data will remain on the server for recovery.'
                },
                toasts: {
                    saveSuccess: 'Record saved successfully!',
                    saveError: 'Error saving: Check if the CPF/CNPJ already exists or if the fields are correct.',
                    deleteSuccess: 'Record deleted successfully!',
                    deleteError: 'Error deleting record.'
                },
            }
        }
    },
    pricingPage: {
        nav: {
            portal: 'Portal',
            home: 'Home',
            comparison: 'Comparison',
            byodb: 'Veritum Cloud',
            subscription: 'Subscription',
            modules: 'Individual Modules',
            faq: 'FAQ'
        },
        modules: {
            badge: 'Total Flexibility',
            title: 'Individual Modules',
            subtitle: 'Need a specific solution? You don\'t have to take the entire ecosystem if you just want to solve an immediate challenge.'
        },
        hero: {
            title: 'Your moment in law,',
            titleAccent: 'our best plan.',
            subtitle: 'Choose the plan that suits your pace. From solo practitioners to corporate legal departments, we have the exact architecture for your growth.',
            cancelGuarantee: 'The legal ecosystem with no setup fee, no contractual penalties, and no lock-in. Subscribe today, cancel anytime.'
        },
        plans: {
            start: {
                name: 'START',
                desc: 'For solo practitioners and new firms. The solid foundation to organize your routine.',
                price: '$297',
                period: '/month',
                features: [
                    'Nexus PRO: Management & Kanban (500 cases)',
                    'Valorem PRO: Financial & PIX',
                    'Vox Clientis: Basic Client Portal',
                    'Support via Email and Chat'
                ],
                cta: 'Start Free Trial'
            },
            growth: {
                name: 'GROWTH',
                desc: 'For growing firms and structured practices. The engine of intelligence and automation.',
                price: '$597',
                period: '/month',
                features: [
                    'Everything in the Start plan, plus:',
                    'Sentinel PRO: Early Detection',
                    'Scriptor PRO: AI Document Generator',
                    'Nexus PRO: Workflow Automation',
                    'Vox Clientis: WhatsApp & AI Translator',
                    'Priority Support'
                ],
                cta: 'Start free trial',
                badge: 'Most Popular'
            },
            strategy: {
                name: 'STRATEGY',
                desc: 'For legal boards and corporations. The strategic cockpit with analytics.',
                price: 'On Request',
                period: '',
                features: [
                    'Everything in the Growth plan, plus:',
                    'Cognitio PRO: BI & Predictive Analytics',
                    'Nexus PRO: Asset & Fleet Management',
                    'Valorem PRO: Contingency Reports',
                    'Dedicated Success Manager (CSM)'
                ],
                cta: 'Schedule Demo'
            }
        },
        infrastructure: {
            title: 'Your infrastructure. Your rules.',
            subtitle: 'At Veritum PRO, freedom goes beyond the contract: it reaches the root of your data. Choose the architecture model that best suits your firm\'s reality.',
            byodbTitle: 'Absolute Control (BYODB - Included)',
            byodbDesc: 'Connect Veritum PRO directly to your firm\'s own database. Ideal for firms with their own IT infrastructure or local databases (Oracle, Postgres, SQL Server) that demand total sovereignty.',
            cloudTitle: 'Technological Peace of Mind (Veritum Managed Cloud)',
            cloudDesc: 'Want to focus only on practicing law? We take care of the servers for you. Dedicated database, automatic daily backups, cutting-edge encryption, and zero technical configuration. Your office in the cloud in 5 minutes.',
            learnMore: 'Learn More...',
            specificationsLink: 'See technical infrastructure specifications',
            dbPlans: {
                title: 'Veritum Cloud Scalability',
                pro: {
                    name: 'Cloud Professional',
                    badge: 'MANAGER`S CHOICE',
                    subtitle: 'High performance and advanced features for firms in the expansion phase.',
                    cta: 'Activate Professional',
                    price: 'R$ 249.90',
                    interval: '/ month',
                    credits: 'Veritum Credits (R$ 55.00) included',
                    needMore: 'On-demand scalability',
                    featuresTitle: 'Features Included in the Plan:',
                    categories: {
                        compute: 'Processing Power',
                        storage: 'Storage & Traffic',
                        security: 'Security & Continuity'
                    },
                    features: [
                        { text: '100,000 Active Users (MAU)', category: 'compute' },
                        { text: 'then R$ 0.05 per MAU', category: 'compute', isSub: true },
                        { text: '8 GB Dedicated Disk', category: 'storage' },
                        { text: 'then R$ 1.25 per GB', category: 'storage', isSub: true },
                        { text: '250 GB Egress Traffic', category: 'storage' },
                        { text: 'then R$ 0.95 per GB', category: 'storage', isSub: true },
                        { text: '250 GB Cached Network', category: 'storage' },
                        { text: 'then R$ 0.40 per GB', category: 'storage', isSub: true },
                        { text: '100 GB File Storage', category: 'storage' },
                        { text: 'then R$ 0.25 per GB', category: 'storage', isSub: true },
                        { text: 'Priority Technical Support', category: 'security' },
                        { text: 'Daily Backups (7-day retention)', category: 'security' },
                        { text: 'System Logs (7 days)', category: 'security' }
                    ]
                },
                team: {
                    name: 'Cloud Enterprise',
                    badge: 'TOTAL COMPLIANCE',
                    subtitle: 'Bank-level security and strict compliance for large corporations.',
                    cta: 'Activate Enterprise',
                    price: 'R$ 4,399.90',
                    interval: '/ month',
                    credits: 'Veritum Credits (R$ 55.00) included',
                    needMore: 'Enterprise Solutions',
                    featuresTitle: 'Everything in Professional, plus:',
                    features: [
                        { text: 'SOC2 Certification', category: 'security' },
                        { text: 'Restricted Access (Read-only / Project-scope)', category: 'security' },
                        { text: 'HIPAA Compliance (Add-on)', category: 'security' },
                        { text: 'Single Sign-On (SSO) for Managers', category: 'security' },
                        { text: 'Priority Support SLAs', category: 'security' },
                        { text: 'Extended Backups (14 days)', category: 'security' },
                        { text: 'Bulk Log Retention (28 days)', category: 'security' },
                        { text: 'Log Drain Monitoring', category: 'security' },
                        { text: 'then R$ 479.90 per extra drain', category: 'security', isSub: true }
                    ]
                }
            }
        },
        comparison: {
            label: 'Want to analyze every technical detail?',
            hide: 'Hide',
            show: 'Show',
            cta: 'full feature comparison',
            headers: {
                feature: 'Feature',
                start: 'Start',
                growth: 'Growth',
                strategy: 'Strategy'
            },
            categories: {
                nexus: 'Process Management (Nexus)',
                sentinel: 'Vigilance (Sentinel)',
                scriptor: 'Intelligence (Scriptor)',
                valorem: 'Financial (Valorem)',
                vox: 'Relationship (Vox)',
                cognitio: 'Strategy (Cognitio)'
            },
            features: {
                kanban: 'Kanban & Deadlines',
                workflows: 'Automated Workflows',
                assets: 'Asset & Fleet Management',
                capture: 'Early Detection (Distribution)',
                monitoring: 'Journal Monitoring',
                genAi: 'AI Document Generation',
                audit: 'Risk Audit (AI)',
                cashflow: 'Cash Flow & PIX',
                provisioning: 'Provisioning & PJe-Calc',
                portal: 'Client Portal',
                portalBasic: 'Basic',
                portalFull: 'Complete',
                translation: 'AI Translation & WhatsApp',
                bi: 'BI & Predictive Analytics'
            }
        },
        whyChoose: {
            title: 'Why choose the',
            titleAccent: 'ecosystem?',
            subtitle: 'Isolated tools create rework. We designed our plans to ensure the perfect Flow. One module feeds another, eliminating 100% of manual data entry.',
            items: [
                { title: 'Sentinel Capture', desc: 'Identifies the case upon distribution.' },
                { title: 'Nexus Delegate', desc: 'Creates the task for your team.' },
                { title: 'Scriptor Draft', desc: 'AI generates the defense in minutes.' },
                { title: 'Vox Notify', desc: 'Informs the client automatically.' }
            ]
        },
        aLaCarte: {
            badge: 'Total Flexibility',
            title: 'Individual modules',
            subtitle: 'Need a targeted solution? You don\'t have to take the whole ecosystem if you only want to solve one immediate challenge.',
            sentinel: {
                title: 'Sentinel Radar',
                desc: 'Ideal for those who only need to monitor official journals and capture new cases without full management.',
                cta: 'Learn more'
            },
            cognitio: {
                title: 'Cognitio Analytics',
                desc: 'Ideal for directors who already use another management system but need our Judge Analytics.',
                cta: 'Schedule Demo'
            }
        },
        subscriptionModel: {
            title: 'Intelligent subscription vs. common installment',
            subtitle: 'Understand why our model is the ultimate ally for your cash flow and bank limit.',
            subscription: {
                title: 'Veritum Model (Subscription)',
                desc: 'Only the exact amount of the current cycle (monthly, quarterly, etc.) is charged to your card. Your credit limit remains free for the daily needs of the firm.'
            },
            installment: {
                title: 'Common Model (Installment)',
                desc: 'The total amount for the year is blocked all at once on your card, consuming your limit and making new financial operations difficult.'
            },
            modelDescription: "Unlike a traditional installment purchase, which blocks your card's total limit on the first day, Veritum PRO uses an Intelligent Recurring Subscription model. This means we charge only the exact amount of the current cycle (monthly, quarterly, semiannual, or annual) at each renewal. Your credit limit remains free and your office's cash flow is protected. Premium access to our technology, without the weight of long-term debt."
        },
        faq: {
            title: 'Frequently asked questions',
            questions: [
                { q: 'What happens if I want to cancel my plan?', a: 'No long phone calls or hidden fees. You cancel with one click directly in your dashboard. No grace periods and no lock-in. At Veritum PRO, we don\'t trap you with contracts, we win you over with service excellence. If you decide to leave, you can freely export all your data before closing.' },
                { q: 'Do I need a credit card for the free trial?', a: 'No. We believe in our technology. You test the Start or Growth plans for 14 days with full access, no strings attached.' },
                { q: 'What is the difference between a Veritum PRO Subscription and an installment purchase?', a: 'Unlike an installment purchase, where the total amount (e.g., annual) blocks your credit card limit, the Veritum PRO subscription model performs periodic charges (monthly, quarterly, etc.). This means only the current cycle amount is processed, keeping your limit free for other office needs. Additionally, subscriptions are automatically renewed, but with the freedom to cancel without the bureaucracy of bank installment reversals.' },
                { q: 'How does the case limit work?', a: 'The system doesn\'t charge per "archived case". We price based on your active cases, ensuring you pay only for what generates real effort.' },
                { q: 'Can I change plans later?', a: 'At any time. Veritum PRO has a modular architecture. Upgrade or downgrade with just one click in your settings.' },
                { q: 'Where will my cases and documents be stored?', a: 'The choice is 100% yours. We were pioneers in the legal market by adopting the BYODB (Bring Your Own Database) architecture, allowing you to connect the system to your own servers for absolute control over your digital assets. However, if your firm does not have an IT team, you can hire Veritum Managed Cloud as an add-on to your subscription. In this format, we provide a high-performance database exclusive to your firm, with automatic backup routines and cloud security.' }
            ]
        },
        finalCta: {
            title: 'The future of law',
            titleAccent: 'doesn\'t use spreadsheets.',
            subtitle: 'Join the Veritum PRO ecosystem today and transform your firm into a performance machine.',
            button: 'Create My Account Now',
            footer: 'Developed by AGTech | High Performance LegalTech © 2026 All rights reserved.'
        },
        demoModal: {
            successTitle: 'Request Received!',
            successDesc: 'One of our expert consultants will contact you via WhatsApp to confirm the **best time** on the date you suggested.',
            title: 'Strategic Demonstration',
            subtitle: 'Fill in the details below to qualify your appointment.',
            labels: {
                name: 'Full Name',
                email: 'Corporate Email',
                whatsapp: 'WhatsApp',
                teamSize: 'Team Size / Volume',
                dateRange: 'Select your preferred date range'
            },
            placeholders: {
                name: 'Ex: John Doe',
                email: 'name@firm.com',
                whatsapp: '(11) 99999-9999',
                teamSize: 'Select an option...'
            },
            teamOptions: {
                small: '1 to 5 attorneys (New Firm)',
                medium: '6 to 20 attorneys (Expanding Firm)',
                large: '+20 attorneys or Legal Dept.'
            },
            calendar: {
                tooltip1: 'Click once for the start and again for the end of your desired range.',
                tooltip2: 'We will contact you to confirm the best time within this interval.',
                error: 'Please select a date range for the demonstration.'
            },
            submitBtn: 'Confirm Suggestion',
            submitting: 'Sending...'
        }
    },
    landingPages: {
        nexus: {
            nav: {
                home: 'Home',
                vision: 'Vision',
                features: 'Features',
                ux: 'Differential'
            },
            hero: {
                badge: 'High Performance Management',
                title: 'Your office\'s command center.',
                subtitle: 'Where chaos turns into clarity. Centralize cases, deadlines, and team in a single intelligent panel. Nexus PRO eliminates spreadsheets and automates your routine.',
                cta1: 'Start Free Trial',
                cta2: 'Learn More'
            },
            mockup: {
                title: 'Nexus PRO Kanban',
                columns: {
                    todo: 'To Do (12)',
                    doing: 'In Progress (5)',
                    done: 'Completed (84)'
                }
            },
            vision: {
                stats: {
                    deadlines: 'Deadlines Today',
                    tasks: 'Tasks Completed',
                    productivity: 'Productivity',
                    members: 'Collaborators'
                },
                title: 'Management that keeps up with your pace.',
                subtitle: 'Nexus PRO is the operational heart of the Veritum ecosystem. Designed to reduce your team\'s cognitive load, it brings together all the loose ends of law practice into a clear and intuitive workflow.',
                quote: '"Know exactly who is doing what, by when, and with what priority."'
            },
            features: {
                category: 'Operational Technology',
                title: 'High-Level Functionalities',
                subtitle: 'Tools created for offices that have no time to lose.',
                items: {
                    kanban: {
                        title: 'Case and Deadline Management (Kanban)',
                        desc: 'Transform anxiety into control. Track cases, hearings, and tasks in a fully visual Kanban board.'
                    },
                    automation: {
                        title: 'Advanced Workflows and Automation',
                        desc: 'Delegate on autopilot. Create intelligent workflows that automatically distribute tasks to your team.'
                    },
                    assets: {
                        title: 'Asset and Goods Management in Litigation',
                        desc: 'Have the complete map of the execution. Control certificates, registrations, fleets, and real estate linked to legal processes.'
                    },
                    corporate: {
                        title: 'Corporate Control and Lifecycle',
                        desc: 'Master corporate consulting. Manage non-financial contracts, powers of attorney, and corporate acts with automatic alerts.'
                    }
                }
            },
            ux: {
                title: 'Design thought for your Workflow.',
                subtitle: 'Say goodbye to sluggish systems that are hard to learn. Nexus PRO was created under rigorous user-centered design principles. Fewer clicks, zero distractions, and total focus on what matters.',
                items: {
                    progressive: {
                        title: 'Progressive Disclosure',
                        desc: 'You view the macro panel and access details only when you need them.'
                    },
                    noise: {
                        title: 'Noise-Free Interface',
                        desc: 'Eliminate complex tools that slow your team down. Focus is your ally.'
                    }
                },
                efficiency: 'Efficiency',
                automation: 'Automation'
            },
            finalCta: {
                title: 'Ready to revolutionize your legal management?',
                subtitle: 'Nexus PRO is the solid foundation of your operation and natively connects to the other intelligences of the Veritum Ecosystem.',
                button1: 'Start Now - It\'s Free',
                button2: 'See Subscription Plans',
                footer: 'No credit card required • 2-minute setup'
            },
            footer: {
                slogan: 'The command center for those who practice law with strategy.'
            }
        },
        sentinel: {
            nav: {
                home: 'Home',
                vision: 'Vision',
                features: 'Features',
                ux: 'Differential'
            },
            hero: {
                badge: 'Active Legal Intelligence',
                title: 'Act before the official summons. The definitive radar.',
                subtitle: 'Monitor publications, summons, and discover new lawsuits at the moment of distribution. Sentinel PRO scans the entire country so you never have to fear missing a deadline or suffering a default judgement.',
                cta1: 'Start Free Trial',
                cta2: 'Discover Plans',
                check: 'Join lawyers who have stopped searching for cases manually.'
            },
            mockup: {
                title: 'Sentinel PRO Cockpit',
                alerts: '12 CRISIS ALERTS',
                stats: {
                    intimations: 'SUMMONS TODAY',
                    timeSaved: 'TIME SAVED'
                }
            },
            vision: {
                title: 'Your Legal Surveillance "Cockpit".',
                subtitle: 'Sentinel PRO is not just a search engine; it\'s the risk sensor of the Veritum ecosystem. We process thousands of publications and procedural movements per day, filtering out the noise and delivering only what is strictly relevant to you and your clients.',
                box: 'With a clean and intelligent visual panel, we group information so you know exactly where your attention is needed today, reducing the fatigue of looking at dozens of screens.'
            },
            features: {
                category: 'Proactive Technology',
                title: 'Suggested Features',
                items: {
                    revelia: {
                        title: 'Anticipate Summons',
                        desc: 'Don\'t wait for the court officer to knock on the door. Our robots detect new actions at the exact moment of filing (distribution). Receive case alerts up to 30 days before the official summons.'
                    },
                    zeroDeadlines: {
                        title: 'Zero Missed Deadlines',
                        desc: 'Forget manual searching. Sentinel PRO automatically scans the Official Gazettes, DJEN, and the country\'s courts. Receive intelligent alerts of summons and movements in real time.'
                    },
                    reputation: {
                        title: 'Protect Client Reputation',
                        desc: 'Surveillance goes beyond the courts. Monitor brands in newspapers, news portals, and consumer protection agencies (Procon, Consumidor.gov). Act as a proactive corporate shield.'
                    },
                    aiIntelligence: {
                        title: 'Intelligence that reads for you',
                        desc: 'Our AI reads publications and classifies content instantly. Visual indicators (like red for High Risk) help you prioritize urgencies in a second.'
                    }
                }
            },
            ux: {
                title: 'An interface that thinks like a lawyer.',
                subtitle: 'Complex tools slow down your work. We designed Sentinel PRO to ensure total focus. No "data walls", you view clean charts, intuitive navigation, and color-coded alerts that prevent errors.',
                list: [
                    'Total focus: Fewer clicks, more results.',
                    'Color-coded alerts: Instant prioritization.',
                    'AI Summaries: Leave the dense reading to us.',
                    'Quick action: Turn alerts into tasks with one click.'
                ],
                grid: {
                    vision: '360º Vision',
                    security: 'Total Security',
                    action: 'Instant Action',
                    stress: 'End of Stress'
                }
            },
            finalCta: {
                title: 'Ready to never worry about Publications again?',
                subtitle: 'Sentinel PRO is brilliant on its own, but unbeatable in the Veritum Ecosystem. Join hundreds of law firms that have elevated their operational safety.',
                button1: 'Start Now - It\'s Free',
                button2: 'See Subscription Plans',
                footer: 'No credit card required • Quick setup'
            },
            footer: {
                slogan: 'The proactive radar for those who don\'t accept the risk of default.'
            }
        },
        scriptor: {
            nav: {
                home: 'Home',
                vision: 'Vision',
                features: 'Features',
                ux: 'Differential'
            },
            hero: {
                badge: 'Generative Document AI',
                title: 'The intelligence that drafts, reviews, and protects.',
                subtitle: 'The end of the "Blank Page Syndrome". Turn hours of drafting and reviewing into minutes with your AI-powered legal co-pilot.',
                cta1: 'Start Free Trial',
                cta2: 'Learn more'
            },
            mockup: {
                title: 'Scriptor PRO Editor',
                pilot: 'AI Co-pilot suggesting...',
                accept: 'TAB to Accept'
            },
            stats: {
                drafting: 'Drafting Time',
                clauses: 'Unfair Clauses',
                signatures: 'Signatures Today',
                search: 'Global Search'
            },
            vision: {
                title: 'More than an editor. A legal mind by your side.',
                desc1: 'Scriptor PRO doesn\'t replace your strategy; it empowers it. We\'ve developed an intelligent document ecosystem that reads, understands context, and suggests best legal practices.',
                desc2: 'Focus your energy on the intellect of the thesis, while our algorithms take care of formatting, reviewing, and hunting for hidden risks.'
            },
            features: {
                category: 'Document Technology',
                title: 'Elite Features',
                subtitle: 'Tools created for firms and departments that demand maximum productivity.',
                items: {
                    generator: {
                        title: 'Drafting & Contract Generator (AI)',
                        desc: 'Speed up your production. Our AI analyzes the context of your case and automatically drafts minutes, pleadings, and contracts.'
                    },
                    auditor: {
                        title: 'Contract Risk Audit (AI)',
                        desc: 'Never let a "trap" go unnoticed. Instantly identify unfair clauses and points of attention.'
                    },
                    repository: {
                        title: 'Intelligent Repository (DMS)',
                        desc: 'The end of lost folders. Store templates and files in a secure digital vault with full compliance with data protection regulations.'
                    },
                    signature: {
                        title: 'Native Digital Signature',
                        desc: 'Close deals without third-party platforms. Send documents for signature via mobile with guaranteed legal validity.'
                    }
                },
                cta: 'Learn more'
            },
            ux: {
                title: 'Your environment of absolute focus.',
                subtitle: 'Technology is only good when it doesn\'t get in the way. We designed SCRIPTOR PRO with a minimalist design to protect your concentration. Stay in the Flow from the beginning to the end of your drafting.',
                items: {
                    contextual: {
                        title: 'Contextual AI',
                        desc: 'It suggests, you approve. The control is always yours.'
                    },
                    versioning: {
                        title: 'Secure Versioning',
                        desc: 'Restore previous versions with one click.'
                    },
                    search: {
                        title: 'Global Search',
                        desc: 'Find words in thousands of PDFs in milliseconds.'
                    }
                }
            },
            finalCta: {
                title: 'Ready to multiply your production capacity?',
                subtitle: 'Whether operating alone as a Super Legal ChatGPT or seamlessly integrated into the Veritum Ecosystem, Scriptor PRO is your firm\'s unfair advantage.',
                button1: 'Start Now - It\'s Free',
                button2: 'See Subscription Plans',
                footer: 'No credit card required • Quick setup'
            },
            footer: {
                slogan: 'The technology of those who practice law at the state of the art.'
            }
        },
        valorem: {
            nav: {
                home: 'Home',
                vision: 'Vision',
                features: 'Features',
                ux: 'Differential'
            },
            hero: {
                badge: 'Legal Financial Intelligence',
                title: 'Your financial health on autopilot.',
                subtitle: 'Receive your fees without bureaucracy. Say goodbye to confusing spreadsheets and delinquency. Valorem PRO solves legal calculations and automates billing.',
                cta1: 'Start Free Trial',
                cta2: 'Learn more'
            },
            mockup: {
                monthly: 'Monthly Revenue',
                pix: 'Payment via PIX',
                pay: 'Pay Now',
                direct: 'Direct PIX',
                boleto: 'Boleto',
                efficiency: 'Efficiency',
                today: 'Today'
            },
            stats: {
                revenue: 'Monthly Revenue',
                overdue: 'Delinquency',
                provision: 'Risk Provision',
                liquidity: 'Liquidity Today',
                liquidityVal: 'High'
            },
            vision: {
                title: 'Stop chasing clients. Let the system do it for you.',
                desc: 'Valorem PRO was designed for lawyers who don\'t want to waste time with bureaucratic treasury tasks. Know exactly who paid, who owes, and what the revenue projection for the quarter is.',
                quote: '"A real-time view, from cents to millions, without needing to be a finance expert."'
            },
            features: {
                category: 'Financial Technology',
                title: 'Elite Features',
                subtitle: 'Tools created to ensure the profitability and transparency of your business.',
                items: {
                    management: {
                        title: 'Intelligent Financial Management',
                        desc: 'Take full control. Manage fees, costs, and cash flow. Link each expense directly to the client\'s case.'
                    },
                    billing: {
                        title: 'Boleto Issuance and Integrated PIX',
                        desc: 'Professionalize your collections. Generate PIX QR Codes and boletos with automatic reminders and instant reconciliation in the system.'
                    },
                    calc: {
                        title: 'PJe-Calc Integration and Updates',
                        desc: 'No more headaches with legal calculations. Import government data and update values with real monetary indices.'
                    },
                    reports: {
                        title: 'Provisioning and Contingency Reports',
                        desc: 'The view required by major boards. Calculate risk provisions and monitor values held in judicial deposits.'
                    }
                },
                cta: 'Learn more'
            },
            ux: {
                title: 'Finance translated into your language.',
                subtitle: 'You\'re from the humanities, and we understand that. Instead of screens full of accounting jargon, Valorem PRO uses visual charts and intuitive icons.',
                items: {
                    conciliation: {
                        title: 'Visual Reconciliation',
                        desc: 'Colors that immediately indicate what is paid, overdue, or pending.'
                    },
                    sharing: {
                        title: 'Uncomplicated Fee Splitting',
                        desc: 'Automatic division of fees between partners and associates.'
                    },
                    export: {
                        title: 'Transparent Export',
                        desc: 'Export reports to your accountant with just one click.'
                    }
                }
            },
            finalCta: {
                title: 'Ready to profit more and worry less?',
                subtitle: 'Seamlessly integrated with Nexus PRO, Valorem ensures that all your legal work is properly recorded, billed, and received.',
                button1: 'Start Now - It\'s Free',
                button2: 'See Subscription Plans',
                footer: 'No credit card required • Setup in 2 minutes'
            },
            footer: {
                slogan: 'Financial control for those who practice law with predictability.'
            }
        },
        cognitio: {
            nav: {
                home: 'Home',
                vision: 'Vision',
                features: 'Features',
                ux: 'Differential'
            },
            hero: {
                badge: 'Predictive Legal Intelligence',
                title: 'The strategic look your board requires.',
                subtitle: 'Data-driven advocacy. Transform complex data into financial predictability and high-impact decisions for your department or firm.',
                cta1: 'Schedule Demo',
                cta2: 'Learn more'
            },
            mockup: {
                kpiGlobal: 'Global KPI',
                activeRisk: 'Active Risk',
                sentences: 'Sentences',
                sentencesValue: '1.2k',
                sentencesSub: 'Today',
                analysisTitle: 'Success Analysis by Court'
            },
            stats: {
                successRate: 'Success Rate',
                mitigatedRisk: 'Mitigated Risk',
                avgTime: 'Average Time',
                avgTimeVal: '14 Months',
                predictability: 'Predictability',
                predictabilityVal: 'High'
            },
            vision: {
                title: 'Stop lawyering in the dark. Intuition gives way to precision.',
                desc: 'Major firms and corporate legal departments cannot rely on "guesswork". Cognitio PRO reads the history of thousands of decisions so you know when a settlement or litigation is more advantageous.',
                quote: '"Have a full x-ray of your operation in the palm of your hand and report to the board with absolute security."'
            },
            features: {
                category: 'Analytical Technology',
                title: 'Elite Features',
                subtitle: 'Tools created for partners and directors who need fast and accurate answers.',
                items: {
                    bi: {
                        title: 'Dashboards and Legal BI',
                        desc: 'Visualize the performance of the entire operation in interactive panels. Identify bottlenecks and productivity metrics in real time.'
                    },
                    predictive: {
                        title: 'Predictive Outcome Analysis (AI)',
                        desc: 'Our AI crosses case law and procedural history data to calculate the probability of winning even before filing.'
                    },
                    judges: {
                        title: 'Magistrate and District X-Ray',
                        desc: 'Know the mind of who will judge. Detailed reports on how each court typically decides on specific topics.'
                    },
                    corporate: {
                        title: 'Corporate View and Provisioning',
                        desc: 'Track costs by branch or project. Discover which sectors face the highest litigation and act preventively.'
                    }
                },
                cta: 'Learn more'
            },
            ux: {
                title: 'The end of the "Wall of Numbers".',
                subtitle: 'Executives don\'t have time to decipher spreadsheets. We designed Cognitio PRO with the best visualization practices for quick decisions.',
                items: {
                    disclosure: {
                        title: 'Progressive Disclosure',
                        desc: 'Clean macro scenario with the possibility of total drill-down in one click.'
                    },
                    trends: {
                        title: 'Trend Highlighting',
                        desc: 'Color-coded charts that indicate risks and opportunities instantly.'
                    },
                    export: {
                        title: 'Executive Export',
                        desc: 'Generate perfect visual reports for presentations in seconds.'
                    }
                }
            },
            finalCta: {
                title: 'Ready to lead with data intelligence?',
                subtitle: 'Ideal for structured firms and corporations seeking excellence, predictability, and profitability in their legal operation.',
                button1: 'Schedule Exclusive Demo',
                button2: 'See Subscription Plans'
            },
            footer: {
                slogan: 'The technology of those who dictate the rules of the game.'
            }
        },
        vox: {
            nav: {
                home: 'Home',
                vision: 'Vision',
                features: 'Features',
                ux: 'Differential'
            },
            hero: {
                badge: 'Gold Standard Service',
                title: 'The end of the question: "Doctor, how is my case doing?"',
                subtitle: 'Uninterrupted legal communication. Automate your service with WhatsApp integration and Artificial Intelligence. Build loyalty with absolute transparency.',
                cta1: 'Start Free Trial',
                cta2: 'Learn more'
            },
            mockup: {
                title1: 'Veritum Automations',
                status: 'online',
                msg1: 'Hi John! 👋',
                msg2: 'The judge advanced your case today. In simple words, this means we have entered the final phase for the sentencing.',
                time: '10:45',
                aiLabel: 'AI Translator:',
                msg3: 'Don\'t worry, the process is following the expected schedule. Next step: Evidentiary Hearing.',
                clientBanner: 'Happy Client',
                percentage: '98%'
            },
            vision: {
                stats: {
                    messages: 'Messages Sent',
                    messagesVal: '1,240',
                    timeSaved: 'Time Saved',
                    timeSavedVal: '45h',
                    satisfaction: 'Satisfaction',
                    satisfactionVal: '98%',
                    availability: 'Availability',
                    availabilityVal: '24/7'
                },
                title: 'Excellence in service on autopilot.',
                desc1: 'The biggest cause of dissatisfaction among legal clients is the lack of communication. Vox Clientis fills this gap by acting as your relationship manager 24 hours a day.',
                desc2: 'Share the progress of actions in an agile and proactive way, ensuring your client feels secure and your personal WhatsApp remains free of demands.'
            },
            features: {
                category: 'Relationship Technology',
                title: 'Elite Features',
                subtitle: 'Tools created for firms that value and professionalize the client experience.',
                items: {
                    translator: {
                        title: 'Legal Jargon Translator (AI)',
                        desc: 'Our AI reads the procedural progress and automatically translates it into simple and empathetic language for your client.'
                    },
                    automation: {
                        title: 'WhatsApp Automation',
                        desc: 'Send case updates, hearing reminders, and payment links directly to the client\'s preferred channel.'
                    },
                    portal: {
                        title: 'Exclusive Client Portal',
                        desc: 'Offer a secure web portal with your brand identity for checking status, documents, and basic questions.'
                    },
                    proactive: {
                        title: 'Proactive Communication',
                        desc: 'Inform before being asked. The system triggers automatic notifications whenever something relevant happens in the case.'
                    }
                },
                cta: 'Learn more'
            },
            ux: {
                title: 'Transparency that generates referrals.',
                subtitle: 'We designed Vox Clientis with an inclusive and welcoming interface not just for you, but especially for the end consumer.',
                items: {
                    boundaries: {
                        title: 'Professional Boundaries',
                        desc: 'The client accesses their Portal; your team works in Nexus. Everyone in their own space.'
                    },
                    accessibility: {
                        title: 'Universal Accessibility',
                        desc: 'Simple screens, readable fonts, and clear language for any client profile.'
                    },
                    notifications: {
                        title: 'Proactive Notifications',
                        desc: 'End anxiety. Keep the client informed in real time.'
                    }
                },
                mockupLabels: {
                    chat: 'Online Chat',
                    process: 'View Case'
                }
            },
            finalCta: {
                title: 'Ready to raise the bar on your service?',
                subtitle: 'Natively integrated with Sentinel and Nexus, Vox Clientis closes the perfect loop of your operation: the system monitors, you execute, and the client is informed.',
                button1: 'Start Now - It\'s Free',
                button2: 'See Subscription Plans',
                footer: 'No credit card required • Setup in 2 minutes'
            },
            footer: {
                slogan: 'The technology for those who practice law with empathy and professionalism.'
            }
        }
    },
    infrastructurePage: {
        nav: {
            home: 'Home',
            architecture: 'Architecture',
            security: 'Security',
            faq: 'FAQ'
        },
        hero: {
            title: 'Sovereignty, Security, and High Performance.',
            subtitle: 'Discover the data engineering behind Veritum PRO. Designed to meet the most rigorous compliance and GDPR requirements in the legal market.'
        },
        architecture: {
            title: 'Choice of Architecture',
            subtitle: 'We understand that each office has a different technological maturity. Therefore, we offer two paths for your data management:',
            cloud: {
                title: 'Managed Veritum Cloud',
                desc: 'Focus on "Technological Peace of Mind". Each client has an exclusive and isolated database. Automatic daily backups retained for 7 days, state-of-the-art encryption, and continuous availability without the need for an internal IT team.'
            },
            byodb: {
                title: 'Absolute Control (BYODB)',
                desc: 'Focus on "Absolute Control". Connect Veritum PRO to your own servers (AWS, Google Cloud, Azure) or local databases (Oracle, Postgres, SQL Server). Maintain local custody and total sovereignty over your firm\'s digital assets.'
            }
        },
        enterprise: {
            title: 'Ready for Large Corporate Operations.',
            subtitle: 'For STRATEGY plan clients, our infrastructure can be upgraded to SOC2 certification, SSO (Single Sign-On) policies, and extended backup retention for 14 days.',
            label: 'Enterprise Level Security'
        },
        faq: {
            title: 'Frequently Asked Questions',
            questions: [
                {
                    q: 'Will my data mix with that of other law firms?',
                    a: 'No. In our Managed Cloud, we use physically isolated projects for each client, ensuring there is no sharing of critical resources or data.'
                },
                {
                    q: 'Do you comply with data protection regulations (GDPR)?',
                    a: 'Yes. All traffic is encrypted via TLS, and data at rest uses AES-256 encryption. Additionally, we implement granular access controls (RBAC).'
                },
                {
                    q: 'How does backup work?',
                    a: 'Routines are automatic and daily. In the Managed Cloud model, we maintain a 7 or 14-day history (depending on the plan) for rapid recovery in case of incidents.'
                }
            ]
        }
    },
    managementCloud: {
        title: 'Cloud Management / Add-Ons',
        subtitle: 'Manage the Veritum Cloud packages (database, storage) displayed at checkout.',
        editing: 'Editing in:',
        unnamed: 'Unnamed',
        translateAI: 'Translate AI',
        baseInfo: 'Base Information',
        monthlyPrice: 'Monthly Price ($)',
        codeName: 'Code Name',
        translationsDisplay: 'Translations (Display)',
        planName: 'Plan Name',
        badge: 'Badge (Optional)',
        subtitleLabel: 'Subtitle',
        credits: 'Included Credits',
        needMore: 'Call to Action (Need More)',
        featuresTitle: 'Features Title',
        featuresList: 'Features',
        addFeature: 'Add Feature',
        markSub: 'Sub-feature',
        catPlaceholder: 'Category (ex: compute)',
        descPlaceholder: 'Feature text...',
        noFeatures: 'No features registered.'
    },
    clubeVip: {
        exclusiveInvite: 'Exclusive Invitation: VIP Club',
        nav: {
            home: 'Home',
            benefits: 'Benefits',
            rewards: 'Rewards',
            goal: '100% Goal'
        },
        hero: {
            access: 'Restricted Access',
            title: 'Welcome to the elite of legal technology.',
            subtitle: 'More than a management platform, the Veritum PRO VIP Club is an exclusive network for GROWTH and STRATEGY plan subscribers. Unlock premium tools, shield your communication, and be rewarded for bringing new firms into our ecosystem.',
            ctaActivate: 'Activate My VIP Profile',
            ctaLearn: 'Learn Benefits'
        },
        benefits: {
            title: 'Your Exclusive Digital Identity',
            subtitle: 'As a VIP member, you get immediate access to a shielded @veritumpro.com mailbox (exclusive for Growth and Strategy subscribers on semi-annual or annual plans).',
            description: 'Strategically separate court and system notifications from your personal inbox. Beyond absolute organization, this is your early access channel: receive market updates and beta features before everyone else.',
            items: [
                'Professional / Personal Separation',
                'Automatic Summoning Filter',
                'Official Veritum Beta Communication'
            ],
            webmail: 'Shielded Webmail',
            military: 'Military Grade Protection',
            address: 'Your Official Address',
            smartFilter: 'Smart Filter',
            smartFilterDesc: 'Automatically redirect court notifications.',
            earlyAccess: 'Early Access',
            earlyAccessDesc: 'Be the first to test our new AIs.'
        },
        rewards: {
            title: 'Expand the network. Earn points. Zero your subscription.',
            subtitle: 'Good lawyers walk with good lawyers. At the Veritum VIP Club, your influence funds your firm\'s technology.',
            detail: 'For every colleague you bring into our ecosystem, you accumulate VIP Points that turn into real discounts on your next invoice (1 Point = 1% OFF).',
            accelerators: 'How to accelerate your earnings:',
            cycles: {
                monthly: 'Monthly',
                quarterly: 'Quarterly',
                semiannually: 'Semi-annually',
                annually: 'Annually',
                point: 'Point',
                points: 'Points'
            },
            plans: {
                start: {
                    name: 'START Plan',
                    desc: 'Ideal for new firms',
                    points: '1 to 5',
                    label: 'VIP Points'
                },
                growth: {
                    name: 'GROWTH Plan',
                    desc: 'Accelerated growth',
                    points: '2 to 10',
                    label: 'VIP Points'
                },
                strategy: {
                    name: 'STRATEGY Plan',
                    desc: 'Your fastest shortcut',
                    points: '3 to 15',
                    label: 'VIP Points!'
                }
            }
        },
        goal: {
            title: 'The Grand Goal (100% OFF)',
            description: 'Accumulate 100 VIP Points and use 100% of Veritum PRO modules entirely on us in your next cycle.',
            progress: '100% OFF Achieved',
            persistenceTitle: 'Your effort is never lost',
            persistenceDesc: 'Exceeded the 100-point goal? Don\'t worry. All excess points are counted and automatically transferred to your subsequent billing cycle. Keep your network active and ensure year-round peace of mind.'
        },
        ctaFinal: {
            title1: 'Ready allowed to take',
            title2: 'Your place in the club?',
            button: 'Activate Benefits Now'
        },
        footer: {
            copyright: '© {year} Veritum PRO - All rights reserved'
        }
    }
};
