;; LoopMint - Reward Distribution Platform

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-already-exists (err u101)) 
(define-constant err-not-found (err u102))
(define-constant err-inactive (err u103))
(define-constant err-insufficient-balance (err u104))
(define-constant err-not-eligible (err u105))
(define-constant err-max-claims-reached (err u106))
(define-constant err-invalid-params (err u107))
(define-constant err-creator-claim (err u108))

;; Data Variables
(define-data-var total-campaigns uint u0)

;; Define reward token
(define-fungible-token reward-token)

;; Data Maps
(define-map campaigns uint {
    creator: principal,
    name: (string-ascii 64),
    total-amount: uint,
    remaining-amount: uint,
    reward-per-claim: uint,
    active: bool,
    max-claims-per-user: uint,
    whitelist-enabled: bool
})

(define-map participant-claims { campaign-id: uint, participant: principal } uint)

(define-map campaign-whitelist { campaign-id: uint, participant: principal } bool)

;; Validate campaign parameters
(define-private (validate-campaign-params (total-amount uint) (reward-per-claim uint) (max-claims uint))
    (and
        (> total-amount u0)
        (> reward-per-claim u0)
        (>= total-amount reward-per-claim)
        (> max-claims u0)))

;; Create new campaign with whitelist and multi-claim support
(define-public (create-campaign (name (string-ascii 64)) 
                            (total-amount uint) 
                            (reward-per-claim uint)
                            (max-claims uint)
                            (whitelist-enabled bool))
    (let
        ((campaign-id (var-get total-campaigns)))
        (asserts! (validate-campaign-params total-amount reward-per-claim max-claims) err-invalid-params)
        (if (is-eq tx-sender contract-owner)
            (begin
                (try! (ft-mint? reward-token total-amount tx-sender))
                (map-set campaigns campaign-id {
                    creator: tx-sender,
                    name: name,
                    total-amount: total-amount,
                    remaining-amount: total-amount,
                    reward-per-claim: reward-per-claim,
                    active: true,
                    max-claims-per-user: max-claims,
                    whitelist-enabled: whitelist-enabled
                })
                (var-set total-campaigns (+ campaign-id u1))
                (ok campaign-id))
            err-owner-only)))

;; [Previous whitelist functions remain unchanged]

;; Claim reward with enhanced validation
(define-public (claim-reward (campaign-id uint))
    (let
        ((campaign (unwrap! (map-get? campaigns campaign-id) err-not-found))
         (claims (default-to u0 (map-get? participant-claims { campaign-id: campaign-id, participant: tx-sender }))))
        (asserts! (not (is-eq tx-sender (get creator campaign))) err-creator-claim)
        (asserts! (get active campaign) err-inactive)
        (asserts! (>= (get remaining-amount campaign) (get reward-per-claim campaign)) err-insufficient-balance)
        (asserts! (is-eligible tx-sender campaign-id) err-not-eligible)
        (asserts! (< claims (get max-claims-per-user campaign)) err-max-claims-reached)
        
        ;; Update campaign and transfer reward
        (try! (ft-transfer? reward-token (get reward-per-claim campaign) (get creator campaign) tx-sender))
        (map-set campaigns campaign-id (merge campaign {
            remaining-amount: (- (get remaining-amount campaign) (get reward-per-claim campaign))
        }))
        (map-set participant-claims { campaign-id: campaign-id, participant: tx-sender } (+ claims u1))
        (ok true)))

;; [Remaining functions unchanged]
