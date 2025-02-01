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

;; Create new campaign with whitelist and multi-claim support
(define-public (create-campaign (name (string-ascii 64)) 
                              (total-amount uint) 
                              (reward-per-claim uint)
                              (max-claims uint)
                              (whitelist-enabled bool))
    (let
        ((campaign-id (var-get total-campaigns)))
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

;; Add participant to campaign whitelist
(define-public (add-to-whitelist (campaign-id uint) (participant principal))
    (let
        ((campaign (unwrap! (map-get? campaigns campaign-id) err-not-found)))
        (if (is-eq tx-sender (get creator campaign))
            (begin
                (map-set campaign-whitelist { campaign-id: campaign-id, participant: participant } true)
                (ok true))
            err-owner-only)))

;; Remove participant from campaign whitelist
(define-public (remove-from-whitelist (campaign-id uint) (participant principal))
    (let
        ((campaign (unwrap! (map-get? campaigns campaign-id) err-not-found)))
        (if (is-eq tx-sender (get creator campaign))
            (begin
                (map-delete campaign-whitelist { campaign-id: campaign-id, participant: participant })
                (ok true))
            err-owner-only)))

;; Claim reward with whitelist and multi-claim checks
(define-public (claim-reward (campaign-id uint))
    (let
        ((campaign (unwrap! (map-get? campaigns campaign-id) err-not-found))
         (claims (default-to u0 (map-get? participant-claims { campaign-id: campaign-id, participant: tx-sender }))))
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

;; Check if participant is eligible for reward including whitelist check
(define-private (is-eligible (participant principal) (campaign-id uint))
    (let
        ((campaign (unwrap! (map-get? campaigns campaign-id) false))
         (whitelisted (default-to false (map-get? campaign-whitelist { campaign-id: campaign-id, participant: participant }))))
        (if (get whitelist-enabled campaign)
            whitelisted
            true)))

;; Get campaign details
(define-read-only (get-campaign (campaign-id uint))
    (ok (map-get? campaigns campaign-id)))

;; Get participant claim count
(define-read-only (get-participant-claims (campaign-id uint) (participant principal))
    (ok (default-to u0 (map-get? participant-claims { campaign-id: campaign-id, participant: participant }))))

;; Check if participant is whitelisted
(define-read-only (is-whitelisted (campaign-id uint) (participant principal))
    (ok (default-to false (map-get? campaign-whitelist { campaign-id: campaign-id, participant: participant }))))

;; End campaign
(define-public (end-campaign (campaign-id uint))
    (let
        ((campaign (unwrap! (map-get? campaigns campaign-id) err-not-found)))
        (if (is-eq tx-sender (get creator campaign))
            (begin
                (map-set campaigns campaign-id (merge campaign { active: false }))
                (ok true))
            err-owner-only)))
